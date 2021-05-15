module.exports = {
  showVersion,
  showHelpMenu,
  noInputFound,
  invalidCredentials,
  welcomeFunction,
  getDate,
  successMessage,
  createDir,
  deleteFile
};

const fs = require("fs");
const emoji = require("node-emoji");
var Table = require("cli-table");

// ! Function to check if the folder already exists, if yes do nothing. Else create the folder

function createDir(path) {
    if (fs.existsSync(path)) {
        //exists -> do nothing
    } else {
        //not exists -> create the folder
        fs.mkdirSync(path);
    }
}

// ! Function to delete a file it exists
function deleteFile(path){
  if(fs.existsSync(path)){
    //delete
    fs.rmSync(path);
  }else{
    //nothing
  }
}

// * function to generate date current date in required format 
function getDate() {
  var d = new Date();
  let split = d.toString().split(" ");
  let time = split[4].split(":");
  const date =
    split[2] + "_" + split[1] + "_" + split[3] + "-" + time[0] + ":" + time[1];
  return date;
}

// * function that runs when the backup has been taken successfully 
function successMessage(date, store, successBackup, failureBackup) {

  // * code snippet used to create table to display the result to the user.

  var table = new Table({ head: ["Project Id".white, "Backup Status".white] });

  // * add all successfully backup taken projects to the table
  for (let i = 0; i < successBackup.length; i++) {
    let element = successBackup[i];
    table.push([
      element.yellow,
      "*".green.bold + " Database Backup Success".white,
    ]);
  }

  // * add all unsuccessfully backup taken projects to the table
  for (let i = 0; i < failureBackup.length; i++) {
    let element = failureBackup[i];
    table.push([element.yellow, "*".red.bold + " Database Not Found".white]);
  }

  // * display the table
  console.log(table.toString() + "\n");

  // * display the storage location of backup
  console.log("\n" + emoji.get("thumbsup") + " Backup Successful on " + date);
  console.log("\nFind Your Backup At " + emoji.get("file_folder") + "  "+ store);
}

// * function to display the welcome message to the user
function welcomeFunction() {
  console.log(
    emoji.get("white_check_mark") + " Id and Password matches the input format"
  );
  console.log(emoji.get("clock1230") + " Backup-Ing Your Database \n");
}

// * function to display the version to the user
function showVersion() {
  console.log("version 1.0.0");
}

// * function to display the help menu to the user
function showHelpMenu() {
  console.log(
    "\n" +
      emoji.get("exclamation") +
      " Firebase Realtime Database Backup" +
      emoji.get("exclamation") +
      "\n"
  );
  console.log(
    "Syntax Format : " +
      emoji.get("e-mail") +
      " Argument 1 -> Your Email Id " +
      emoji.get("key") +
      " Argument 2 -> Your Password"
  );
  console.log(
    "\n" + emoji.get("100") + " Happy Backup-Ing " + emoji.get("100")
  );

  console.log("\nMade with " + emoji.get("heart") + " by Abhishek Mishra");
}


// ! function to tell the user that only one input was provided to the script
function noInputFound() {
  console.log(
    emoji.get("exclamation") +
      " kindly enter email and password both " +
      emoji.get("exclamation")
  );
}

// ! function to tell the user that credentials entered are incorrect
function invalidCredentials(item) {
  console.log(emoji.get("x") + " " + item + emoji.get("x"));
  console.log(
    emoji.get("closed_lock_with_key") +
      " Kindly Try again with valid credentials " +
      emoji.get("closed_lock_with_key")
  );
}
