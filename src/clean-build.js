const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        try {
          fs.unlinkSync(curPath);
        } catch (err) {
          console.log('Could not delete file:', curPath, err.message);
        }
      }
    });
    try {
      fs.rmdirSync(folderPath);
    } catch (err) {
      console.log('Could not remove folder:', folderPath, err.message);
    }
  }
}

deleteFolderRecursive(path.join(__dirname, 'build'));
console.log('build folder cleaned!');
