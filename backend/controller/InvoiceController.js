const express = require("express");
const router = express.Router();
const axios = require("axios");
const converter = require("number-to-words");
const fs = require('fs');
const path = require('path');

const ZOHO_CLIENT_ID = "1000.2IGANZBRE43JAI5VJVWW3JPRHRKVBM";
const ZOHO_CLIENT_SECRET = "75f54fe54775bf03531e8f0cbb209cc424b471a277";
const ZOHO_REFRESH_TOKEN =
  "1000.4a27799ae1350599110b9f33a677b91e.f7d9c2c30f9700601e7f20beab6d6450";
const ZOHO_ORG_ID = "60030393140";

//To get Access Token
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `https://accounts.zoho.in/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=refresh_token`
    );
    console.log("Access Token response data:", response.data);
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching access token", error.response ? error.response.data : error.message);
    throw error;
  }
};

//Function to convert numbers to words
const convertToWords = (number) => {
  const words = converter.toWords(number);
  return words;
};

//POST route to generate invoice
router.post("/generate", async (req, res) => {
  try {
    const invoiceData = req.body;
    console.log(invoiceData);
    invoiceData.line_items = invoiceData.line_items.map((item) => {
     const unitPrice = parseFloat(item.rate);
      const quantity = parseFloat(item.quantity);
      const discount = parseFloat(item.discount);
      const taxRate = parseFloat(item.tax_rate);

  const netAmount = unitPrice * quantity - discount;
      const taxType = invoiceData.place_of_supply === invoiceData.place_of_delivery ? "CGST/SGST" : "IGST";
      const adjustedTaxRate = taxType === "CGST/SGST" ? taxRate / 2 : taxRate;
      const taxAmount = (netAmount * adjustedTaxRate) / 100;
      const totalAmount = netAmount + taxAmount;

      return {
        ...item,
        net_amount: netAmount,
        tax_type: taxType,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        tax_rate:taxRate,
      };
    });

   // Compute total row and amount in words
   const totalRow = invoiceData.line_items.reduce((acc, item) => acc + item.total_amount, 0);
   const amountInWords = convertToWords(totalRow);

 
   const invoice = ({
     ...invoiceData,
    total_row: totalRow,
    amount_in_words: amountInWords,
   });
   console.log(invoice);

   //Get access token
   const accessToken = await getAccessToken();
   
   const zohoInvoiceData = {
    customer_id: invoice.customer_id,
    date:invoice.date,
    seller_name:invoice.seller_name,
    shipping_address:invoice.shipping_address,
    billing_address:invoice.billing_address,
    line_items: invoice.line_items.map(item => ({
      item_id:item.item_id,
      description: item.description,
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
      taxrate:item.tax_rate,
    })),
   };

   //Create Invoice 
   const response = await axios.post('https://www.zohoapis.in/invoice/v3/invoices',zohoInvoiceData,{
    headers:{
        Authorization : `Zoho-oauthtoken ${accessToken}`,
        'X-in-zoho-invoice-organizationid': ZOHO_ORG_ID
    }
   });
   console.log(response.data);
   const invoiceId = response.data.invoice.invoice_id;
   const invoiceURL = response.data.invoice_url;

   const getInvoice = await axios.get(`https://www.zohoapis.in/invoice/v3/invoices/${invoiceId}?accept=pdf`,{
    headers:{
      Authorization : `Zoho-oauthtoken ${accessToken}`,
      'X-in-zoho-invoice-organizationid': ZOHO_ORG_ID
  },
  responseType: 'arraybuffer',

   });
   const pdfPath = path.join(__dirname, `invoice_${invoiceId}.pdf`);
   console.log(pdfPath);
    fs.writeFileSync(pdfPath, getInvoice.data);


   res.json({
    message:'Invoice created',pdfPath,
    invoice_url:invoiceURL
   });

  } catch (error) {
    console.log('Error creating invoice:', error);
    res.status(500).send(error);
  }
});

module.exports= router;
