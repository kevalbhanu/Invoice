const express = require('express');
const bodyparser =require('body-parser');
const cors = require('cors');
const invoiceRoutes = require('./controller/InvoiceController');
const app = express();
const PORT = 5000;



app.use(bodyparser.json());
app.use(cors());

app.use('/api/invoice',invoiceRoutes);
app.use(cors());

app.listen(PORT,()=>{
    console.log(`>>Server is running on ${PORT}`);
})

