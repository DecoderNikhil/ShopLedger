'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return { id, name, sku: 'SKU-' + id, price, qty, hsn, gstRate };
}

function checkOrder(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ hsn, gstPercent, line, lineTax }) => ({
      hsn, gstPercent, line, lineTax
    }))
  }, expectedInvoice);

  assert.deepEqual({
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total
  }, expectedPricing);
}

test('CURRENT BEHAVIOUR: invoice figures for order #1001 use the supplied 5% and 12% GST rates without a coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item(8, 'Assam CTC Masala Chai 250g', 140, 2, '0902', 18),
      item(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713', 5)
    ]
  };

  checkOrder(order, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 280, lineTax: 50.4 },
      { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  }, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9
  });
});

test('Invoice figures for order #1002 match checkout with SAVE10', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      item(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
    ]
  };

  checkOrder(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
});

test('Invoice figures for order #1004 apply the SAVE10 maximum discount', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
    ]
  };

  checkOrder(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: invoice figures for order #1008 use 18% supplied rates without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
      item(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
    ]
  };

  checkOrder(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
      { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
});

test('Invoice total and GST match checkout for a capped SAVE10 coupon and HSN slab', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')
    ]
  };

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ hsn, gstPercent, line, lineTax }) => ({
      hsn, gstPercent, line, lineTax
    }))
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });

  assert.equal(invoiceFigures.total, pricingFigures.total);
  assert.equal(invoiceFigures.tax, pricingFigures.tax);
});
