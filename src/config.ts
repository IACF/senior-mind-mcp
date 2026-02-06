import dotenv from "dotenv";

dotenv.config();

export const config = {
  developerName: process.env.DEVELOPER_NAME || "Desenvolvedor",
};

// Ao executar este arquivo diretamente (npx tsx src/config.ts), imprime o nome do desenvolvedor
if (process.argv[1]?.endsWith("config.ts")) {
  console.log(config.developerName);
}
