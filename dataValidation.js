module.exports = {checkEmailAndPassword};
const utilJs = require("./util")

function checkEmailAndPassword(id, pass) {
  
    let item = "";
    let checkUser = checkUserName(id),
      checkPass = checkPassword(pass);
  
    if (!checkUser && !checkPass) {
      item = "Username and Password";
    } else if (!checkUser) {
      item = "Username";
    } else if (!checkPass) {
      item = "Password";
    }
  
    if (item == "") {
      //valid case
    } else {
  
      item += " doesn't matches format specified by Google ";
      utilJs.invalidCredentials(item);
      process.exit();
    }
/* Check used by Google while creating a new account
username check - must be b/w 6 and 30 characters
pass - 8 or more character ix of letters, numbers, and symbols
*/

/*Function to check username entered by the user
True -> if matches the format
Otherwise false
*/
function checkUserName(username) {
    if (username.length < 6 || username.length > 30) {
        return false;
    }
    return true;
}

/*Function to check username entered by the user.
True -> if matches the format
Otherwise false
*/
function checkPassword(password) {
    if (password.length < 8) {
        return false;
    }
    let countLetters = 0,
        countNumbers = 0,
        countSymbols = 0;

    const punct = "!,;.-?@#$%^&*():<>/";
    const numbers = "1234567890";
    const alphabets = "abcdefghijklmnopqurstuvxyz";

    for (let i = 0; i < password.length; i++) {
        let ele = password[i];

        if (punct.includes(ele)) {
            countSymbols++;
        } else if (numbers.includes(ele)) {
            countNumbers++;
        } else if (alphabets.includes(ele)) {
            countLetters++;
        }
    }
    if (countLetters >= 1 && countNumbers >= 1 && countSymbols >= 1) {
        return true;
    } else {
        return false;
    }
}
}