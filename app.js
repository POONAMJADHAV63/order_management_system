const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.listen(PORT , ()=>{
    console.log(`Server listening on port: ${PORT}`);
});

app.get("/status", (req,res)=>{
    const status = {"Status": "Running"};
    res.send(status);
});
