const bcrypt = require('bcryptjs');

const saltRounds = 12;

async function hash(data) 
{
  try 
  {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedData = await bcrypt.hash(data, salt);
    return hashedData;
  } 
  catch (error) 
  {
    throw new Error(`Ошибка хеширования: ${error.message}`);
  }
}

async function compare(data, hashedData) 
{
  try 
  {
    return await bcrypt.compare(data, hashedData);
  } 
  catch (error) 
  {
    throw new Error(`Ошибка сравнения: ${error.message}`);
  }
}
module.exports = { hash, compare };