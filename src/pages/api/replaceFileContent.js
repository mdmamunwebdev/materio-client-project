import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { content  } = req.body;

    // Define the path to the file you want to replace
    const filePath = path.join(process.cwd(), 'src/app/api/login', 'users.js');

    // Replace file content
    fs.writeFile(filePath, content , 'utf8', (err) => {
      if (err) {
        res.status(500).json({ message: 'Error writing to file', error: err });
      } else {
        res.status(200).json({ message: 'File content replaced successfully' });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
