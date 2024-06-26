import React, { useState } from "react";

export default function Input() {
  const [invoiceData, setInvoiceData] = useState({
    customer_id:'',
    seller_name:'',
    billing_address: '',
    shipping_address: '',
    date:'',
    line_items: [],
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...invoiceData.line_items];
    items[index] = { ...items[index], [name]: value };
    setInvoiceData({ ...invoiceData,line_items : items });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      line_items: [
        ...invoiceData.line_items,
        {
          item_id:"",
          description: "",
          rate: 0,
          quantity: 0,
          discount: 0,
          tax_rate:18
        },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/invoice/generate',{
        method: 'POST',
        body: JSON.stringify(invoiceData),
        headers: {
            'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log(data);
      alert(`Invoice created successfully.PDF path : ${data.pdfPath}`);
    } catch (err) {
      console.error(err);
      alert('Error creating invoice',err);
    }
  };
  return <div>
    <h1>Create Invoice</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="customer_id" placeholder="Customer Id" onChange={handleInputChange} />
        <input type="text" name="seller_name" placeholder="Seller Name" onChange={handleInputChange} />
        <input type="text" name="billing_address" placeholder="Billing Address" onChange={handleInputChange} />
        <input type="text" name="shipping_address" placeholder="Shipping Address" onChange={handleInputChange} />
        <input type="date" name="date" placeholder="Date" onChange={handleInputChange} />

        {invoiceData.line_items.map((item, index) => (
          <div key={index}>
            <input type="text" name="item_id" placeholder="Item ID" value={item.item_id}onChange={(e) => handleItemChange(index, e)} />
            <input type="text" name="description" placeholder="Description" value={item.discription} onChange={(e) => handleItemChange(index, e)} />
            <input type="number" name="rate" placeholder="Rate"value={item.rate} onChange={(e) => handleItemChange(index, e)} />
            <input type="number" name="quantity" placeholder="Quantity"value={item.quantity} onChange={(e) => handleItemChange(index, e)} />
            <input type="number" name="discount" placeholder="Discount" value={item.discount} onChange={(e) => handleItemChange(index, e)} />
  
          </div>
        ))}

        <button type="button" onClick={addItem}>Add Item</button>
        <button type="submit">Generate Invoice</button>
      </form>
  </div>;
}
