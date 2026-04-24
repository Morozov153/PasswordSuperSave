async function hash256(text) 
{
  try 
  {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } 
  catch (error) 
  {
    throw new Error(`Ошибка SHA-256 хеширования: ${error.message}`);
  }
}

module.exports = { hash256 };