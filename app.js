const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
}

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('image');

const config = require('./config');

const azureStorage = require('azure-storage');
const blogService = azureStorage.createBlobService();
const container = 'imagenes';

const getStream = require('into-stream');

const getBlobName = (originalName) => {
	const identifier = Math.random().toString().replace(/0\./, '');
	return `${identifier}-Franklin-${originalName}`;
};

app.post('/upload', uploadStrategy, (req, res) => {
	const blobName = getBlobName(req.file.originalname);
	const stream = getStream(req.file.buffer);
	const streamLength = getStream(req.file.buffer.length);

	blogService.createAppendBlobFromStream(container, blobName, stream, streamLength, (err) => {
		if (err) {
			console.log(err);
			return;
		}
		res.status(200).send('Archivo subido !!!');
	});
});

app.get('/all', (req, res) => {
	blogService.listBlobsSegmented(container, null, (err, data) => {
		if (err) {
			console.log(err);
			return;
		} else {
			if (data.entries.length) {
				let images = '';
				data.entries.forEach((ele) => {
					images += `<img src="https://${config.getStorageAccountName()}.blob.core.windows.net/${container}/${
						ele.name
					}" width="400"/>`;
				});
				res.status(200).send(images);
			} else {
				res.status(200).send('No hay nada');
			}
		}
	});
});

app.listen(process.env.PORT, () => {
	console.log('Server on port ' + process.env.PORT);
});
