import mongoose from "mongoose";
import { createApp } from "./createApp.mjs";

await mongoose
	.connect("mongodb://localhost:27017")
	.then(() => console.log("Connected to Database"))
	.catch((err) => console.log(`Error: ${err}`));

const app = createApp();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Running on Port ${PORT}`);
});
