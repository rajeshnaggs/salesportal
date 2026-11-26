import { NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';

// ============================================================================
// STANDALONE ACTION FUNCTIONS (Outside GET)
// ============================================================================

async function fetchCustomers() {
  const pool = await getDbPool();
  const result = await pool.request().execute('getcustomer');
  return NextResponse.json({
    success: true,
    data: result.recordset,
  });
}

async function fetchUnifiedOrderToPayment(searchParams: URLSearchParams) {
  const mode = (searchParams.get('mode') || 'FULL').toUpperCase();
  const value = (searchParams.get('value') || '').trim();
const fromDate = searchParams.get('fromDate') || null;
const toDate = searchParams.get('toDate') || null;

// Pass to mssql request:


  // Require a search value if filtering by Customer, Item, or PO
  if (mode !== 'FULL' && !value) {
    return NextResponse.json({
      success: true,
      details: [],
    });
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('Mode', sql.NVarChar(20), mode)
    .input('Value', sql.NVarChar(100), value || null)
    .input('FromDate', sql.Date, fromDate)
    .input('ToDate', sql.Date, toDate)
    .execute('dbo.SP_GET_ORDER_TO_PAYMENT');

  return NextResponse.json({
    success: true,
    details: result.recordset || [],
  });
}

async function fetchPendingQuotations(searchParams: URLSearchParams) {
  const cardCode = searchParams.get('cardCode');
  if (!cardCode || !cardCode.trim()) {
    return NextResponse.json({
      success: true,
      summary: { totalQuotes: 0, totalLines: 0, overallOpenTotal: 0 },
      details: [],
    });
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('cardcode', sql.NVarChar(50), cardCode.trim())
    .execute('sp_GetPendingQuotationByCustomer');

  const sets = result.recordsets as any[];
  const summary = sets?.at(0)?.at(0) || {
    totalQuotes: 0,
    totalLines: 0,
    overallOpenTotal: 0,
  };
  const details = sets?.at(1) || [];

console.log(details)

  return NextResponse.json({
    success: true,
    summary,
    details,
  });
}

async function fetchPendingOrders(searchParams: URLSearchParams) {
  const cardCode = searchParams.get('cardCode');
  if (!cardCode || !cardCode.trim()) {
    return NextResponse.json({
      success: true,
      summary: {
        totalOrders: 0,
        totalLines: 0,
        overallOrderTotal: 0,
        overallOpenBalance: 0,
        openPoLines: 0,
      },
      details: [],
    });
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('cardcode', sql.NVarChar(50), cardCode.trim())
    .execute('sp_GetPendingOrdersByCustomer');

  const sets = result.recordsets as any[];
  const summary = sets?.at(0)?.at(0) || {
    totalOrders: 0,
    totalLines: 0,
    overallOrderTotal: 0,
    overallOpenBalance: 0,
    openPoLines: 0,
  };
  const details = sets?.at(1) || [];

  return NextResponse.json({
    success: true,
    summary,
    details,
  });
}

async function fetchCustomerGroups() {
  const pool = await getDbPool();
  const result = await pool.request().execute('sp_GetCustomerGroups');
  return NextResponse.json({ success: true, data: result.recordset });
}


async function fetchPendingInvoices(searchParams: URLSearchParams) {
  const cardCode = searchParams.get('cardCode');
  if (!cardCode || !cardCode.trim()) {
    return NextResponse.json({
      success: true,
      summary: {
        totalInvoices: 0,
        overdueInvoices: 0,
        overallBilledTotal: 0,
        overallPaidTotal: 0,
        overallBalanceDue: 0,
      },
      details: [],
    });
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('cardcode', sql.NVarChar(50), cardCode.trim())
    .execute('sp_GetPendingInvoicesByCustomer');

  const sets = result.recordsets as any[];
  const summary = sets?.at(0)?.at(0) || {
    totalInvoices: 0,
    overdueInvoices: 0,
    overallBilledTotal: 0,
    overallPaidTotal: 0,
    overallBalanceDue: 0,
  };
  const details = sets?.at(1) || [];

  return NextResponse.json({
    success: true,
    summary,
    details,
  });
}

// ============================================================================
// ACTION REGISTRY & GET HANDLER
// ============================================================================

const GET_ACTIONS: Record<string, (params: URLSearchParams) => Promise<NextResponse>> = {
  CUSTOMERS: () => fetchCustomers(),
  UNIFIED_REPORT: fetchUnifiedOrderToPayment,
  QUOTATIONS: fetchPendingQuotations,
  ORDERS: fetchPendingOrders,
  INVOICES: fetchPendingInvoices,
  CUSTOMER_GROUPS: fetchCustomerGroups,

};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = (searchParams.get('action') || '').toUpperCase();

    const handler = GET_ACTIONS[action];
    if (!handler) {
      return NextResponse.json(
        { success: false, message: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    return await handler(searchParams);
  } catch (error: unknown) {
    console.error('GET /api/dashboard Error:', error);
    const sqlErr = error as {
      message?: string;
      originalError?: { info?: { message?: string } };
    };
    const readableMessage =
      sqlErr?.originalError?.info?.message ||
      sqlErr?.message ||
      'Database query failed';

    return NextResponse.json(
      { success: false, message: String(readableMessage) },
      { status: 500 }
    );
  }
}
