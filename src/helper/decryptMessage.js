import * as crypto from 'crypto';
import fs from 'fs';
import { Buffer } from 'buffer';

const decryptMessage = async (encryptedText, sender) => {
    try {
        const id = localStorage.getItem('id');
        const decodedMessage = Buffer.from(encryptedText, 'base64').toString('utf-8');
        const decodedJson = JSON.parse(decodedMessage);

        if(!fs.existsSync(`encrypt_key${id}.txt`))
            throw new Error("Private Key is absent");

        const jsonData = await fs.promises.readFile(`encrypt_key${id}.txt`);

        if(!JSON.parse(jsonData.toString()).privateKey) 
            throw new Error("Private Key is absent");

        if(sender) {
            var ivString =  crypto.privateDecrypt({
                key: JSON.parse(jsonData.toString()).privateKey,
                passphrase: JSON.parse(jsonData.toString()).passphrase
            }, Buffer.from(decodedJson.senderEncrIV, 'base64')).toString('utf8');
        }
        else {
            ivString =  crypto.privateDecrypt({
                key: JSON.parse(jsonData.toString()).privateKey,
                passphrase: JSON.parse(jsonData.toString()).passphrase
            }, Buffer.from(decodedJson.encrIV, 'base64')).toString('utf8');
        }

        const iv = Buffer.from(ivString, "hex");
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(decodedJson.key.data), iv);
        let decrypted = decipher.update(decodedJson.message, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log(decrypted)
        return decrypted
    } catch (e) {
        console.log(e)
        return encryptedText
    }
}

export default decryptMessage;