const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; 

function getKey() 
{
  const key = Buffer.from(process.env.SUPER_SECRET_ENC_KEY, "base64");
  return key;
}

function encrypt(text) 
{
  if (text == null) return null;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final()]);

  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64"),].join(":");
}

function decrypt(text) 
{
  if (text == null) return null;
  if (text === "") return "";

  const parts = text.split(":");

  const [version, ivB64, dataB64, tagB64] = parts;
  if (version !== "v1") throw new Error("Указана не та версия шифра");

  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };