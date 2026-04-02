# Plano: Refatorar Sistema de Créditos — Client → CreditBucket

## Contexto

Atualmente, créditos são armazenados no campo `available_credits` do modelo `Client`. A operação de consumo (`ExportRecordController`) decrementa esse campo diretamente. O novo modelo introduz `CreditBucket`: cada pacote contratado pelo cliente gera um bucket com saldo próprio, data de expiração e referência ao `CreditPackage`. O consumo passa a ser decrementado do bucket ativo, não do cliente. O `rollback` devolve créditos ao bucket de origem registrado no `LedgerEntry`. Como o projeto usa multibase por tenant, não é necessário associar `CreditBucket` ao `Client`.

---

## Arquitetura da Solução

```
CreditPackage (mongodb-common) — catálogo de pacotes fixos
      ↓ ao contratar
CreditBucket (mongodb, tenant) — pacote contratado com saldo e expiração
      ↓ implements Creditable
CreditManager — sem mudança de assinatura
      ↓ consume / grant / rollback
CreditLedgerEntry — passa a referenciar CreditBucket (em vez de Client)
```

**Seleção do bucket no consume:** buscar o bucket com `available_credits >= amount` ordenado por `expires_at` ASC (consome primeiro o que expira mais cedo). Se não houver nenhum → `InsufficientCreditsException`.

---

## Arquivos Críticos

| Arquivo | Ação |
|---|---|
| `app/Models/CreditBucket.php` | Implementar campos + `Creditable` |
| `app/Models/CreditLedgerEntry.php` | Trocar `client()` → `bucket()` |
| `app/Models/Client.php` | Remover `Creditable`, `available_credits`, `consumeCredits()`; adicionar `getAvailableCredits()` |
| `app/Credits/Adapters/MongoCreditableModel.php` | Sem mudança (adapter genérico) |
| `app/Credits/CreditManager.php` | Sem mudança de assinatura |
| `app/Http/Controllers/ExportRecordController.php` | Buscar bucket ativo ao invés de `$client->consumeCredits()` |
| `database/factories/CreditBucketFactory.php` | Preencher definition() |
| `database/factories/CreditPackageFactory.php` | Preencher definition() |
| `tests/Feature/App/Credits/CreditsManagerTest.php` | Migrar de `ClientFactory` → `CreditBucketFactory` |

---

## Fases de Implementação

### Fase 1 — CreditBucket: Modelo e Factory

**Objetivo:** Implementar o modelo `CreditBucket` com os campos corretos e interface `Creditable`. Preencher a factory para uso em testes.

**TDD:**

RED — `tests/Feature/App/Models/CreditBucketTest.php`:
- `testBucketImplementsCreditable`
- `testBucketHasRequiredFields`
- `testBucketLedgerEntryModelReturnsCreditLedgerEntry`
- `testGetAvailableCreditsReturnsCorrectValue`

GREEN — Implementar `app/Models/CreditBucket.php` com `$fillable`, `$casts` e `getLedgerEntryModel()`. Preencher `CreditBucketFactory` e `CreditPackageFactory`.

REFACTOR + `./vendor/bin/sail bin phpcs`

---

### Fase 2 — Client.getAvailableCredits(): Consultar creditos via CreditBuckets

**Objetivo:** Adicionar metodo `getAvailableCredits()` ao `Client` que soma os `available_credits` de todos os `CreditBucket` nao expirados. Preserva a referencia ao cliente como ponto de consulta de saldo, sem depender do campo `available_credits` do proprio `Client`.

> Como o projeto usa multibase por tenant, todos os buckets na base pertencem ao mesmo cliente sem necessidade de filtro por `client_id`.

**TDD:**

RED — `tests/Feature/App/Models/ClientTest.php`:
- `testGetAvailableCredits_SumsNonExpiredBuckets` — soma os creditos de multiplos buckets validos
- `testGetAvailableCredits_IgnoresExpiredBuckets` — buckets vencidos nao sao contabilizados
- `testGetAvailableCredits_ReturnsZeroWhenNoBuckets` — retorna 0 quando nao ha buckets

GREEN — `app/Models/Client.php` (novo metodo):
```php
public function getAvailableCredits(): int
{
    return CreditBucket::query()
        ->where('expires_at', '>', now())
        ->sum('available_credits');
}
```

REFACTOR + `./vendor/bin/sail bin phpcs`

---

### Fase 3 — CreditLedgerEntry: Trocar relacao Client -> CreditBucket

**Objetivo:** `CreditLedgerEntry` passa a referenciar `CreditBucket` em vez de `Client`.

**TDD:**

RED — `tests/Feature/App/Models/CreditLedgerEntryTest.php`:
- `testLedgerEntryGetCreditable_ReturnsBucket`
- `testLedgerEntryBucketRelationship`

GREEN — Trocar `client()` por `bucket()` em `CreditLedgerEntry`, `getCreditable()` retorna o bucket.

REFACTOR + `./vendor/bin/sail bin phpcs`

---

### Fase 4 — CreditManager: Migrar testes de Client -> CreditBucket

**Objetivo:** Garantir que `CreditManager` opera corretamente com `CreditBucket`. Atualizar testes existentes.

**TDD:**

RED/GREEN — Atualizar `tests/Feature/App/Credits/CreditsManagerTest.php`:
- Substituir `ClientFactory` por `CreditBucketFactory::new()->withCredits(...)`
- Adicionar `testCanRollbackCreditsToOriginalBucket`
- `CreditManager` nao muda — `MongoCreditableModel::make($bucket)` funciona sem alteracao

REFACTOR + `./vendor/bin/sail bin phpcs`

---

### Fase 5 — ExportRecordController: Usar CreditBucket

**Objetivo:** Consumir creditos do bucket ativo (earliest expiry) em vez de `$client->consumeCredits()`.

**TDD:**

RED — `tests/Feature/App/Http/Controllers/ExportRecordControllerTest.php`:
- `testConsumeIsDecrementedFromActiveBucket`
- `testSelectsBucketWithEarliestExpiry`
- `testThrowsWhenNoBucketHasSufficientCredits`
- `testRollsBackToBucketOnExportFailure`

GREEN — No controller:
```php
$bucket = CreditBucket::query()
    ->where('available_credits', '>=', $amount)
    ->orderBy('expires_at')
    ->firstOrFail();

$ledger_entry = app(CreditManager::class)->consume($bucket, $amount);
```
`Client` permanece apenas para `DadoInstalacao`.

REFACTOR + `./vendor/bin/sail bin phpcs`

---

### Fase 6 — Limpeza do Client

**Objetivo:** Remover responsabilidades de credito do `Client`.

**TDD:**

RED — `tests/Feature/App/Models/ClientTest.php`:
- `testClientDoesNotImplementCreditable`
- `testClientDoesNotHaveAvailableCreditsField`

GREEN:
- Remover `implements Creditable`, `getLedgerEntryModel()`, `consumeCredits()`, `available_credits` de `Client`
- Remover `available_credits` e `withCredits()` de `ClientFactory`

REFACTOR + `./vendor/bin/sail bin phpcs`

---

## Verificação End-to-End

```bash
./vendor/bin/sail test
./vendor/bin/sail bin phpcs
```
