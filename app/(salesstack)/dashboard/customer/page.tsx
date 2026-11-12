'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Input,
  HStack,
  Spinner,Table,SimpleGrid
} from '@chakra-ui/react';
import { Search, ChevronDown, X } from 'lucide-react';
import AicNavbar from '@/app/components/AicNavbar';

interface CustomerOption {
  displaymember: string;
  Valmember: string;
}

export default function CustomerDashboardPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

    const formatINR = (val: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Load customers from SQL Server [getcustomer]
  useEffect(() => {
    async function loadCustomers() {
      setLoadingCustomers(true);
      setErrorMsg('');
      try {
        const res = await fetch('/api/dashboard?action=CUSTOMERS');
        const json = await res.json();
        if (!res.ok || !json.success) {
          setErrorMsg(json.message || 'Failed to load customers.');
        } else {
          setCustomers(json.data || []);
        }
      } catch (err: unknown) {
        setErrorMsg( 'Unable to connect to API.');
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  // Filter customers as user types
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.displaymember?.toLowerCase().includes(q) ||
        c.Valmember?.toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);


  // 1. Add these TypeScript interfaces at the top of page.tsx
interface QuotationSummary {
  totalQuotes: number;
  totalLines: number;
  overallOpenTotal: number;
}

interface QuotationItem {
  DocEntry: number;
  DocNum: number;
  DocDate: string;
  CardCode: string;
  CardName: string;
  itemcode: string;
  name: string;
  openqty: number;
  opentotal: number;
  aging: number;
}

// 2. Add state & useEffect inside CustomerDashboardPage
const [quoteSummary, setQuoteSummary] = useState<QuotationSummary>({
  totalQuotes: 0,
  totalLines: 0,
  overallOpenTotal: 0,
});
const [quoteDetails, setQuoteDetails] = useState<QuotationItem[]>([]);
const [loadingQuotes, setLoadingQuotes] = useState(false);

  // 2. Load Pending Quotations ONLY when a Customer is selected
  useEffect(() => {
    if (!selectedCustomer) {
      setQuoteSummary({ totalQuotes: 0, totalLines: 0, overallOpenTotal: 0 });
      setQuoteDetails([]);
      setLoadingQuotes(false);
      return;
    }

    let active = true;
    async function loadQuotations() {
      setLoadingQuotes(true);
      setErrorMsg('');
      const cardParam = `&cardCode=${encodeURIComponent(selectedCustomer!.Valmember)}`;

      try {
        const res = await fetch(`/api/dashboard?action=QUOTATIONS${cardParam}`);
        const json = await res.json();
        if (!active) return;

        if (!res.ok || !json.success) {
          const msg =
            typeof json.message === 'string'
              ? json.message
              : JSON.stringify(json.message);
          setErrorMsg(msg || 'Failed to load quotations.');
        } else {
          setQuoteSummary(
            json.summary || { totalQuotes: 0, totalLines: 0, overallOpenTotal: 0 }
          );
          setQuoteDetails(json.details || []);
        }
      } catch (err: unknown) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Error loading quotations.');
        }
      } finally {
        if (active) setLoadingQuotes(false);
      }
    }

    loadQuotations();
    return () => {
      active = false;
    };
  }, [selectedCustomer]);

//orders

interface OrderSummary {
  totalOrders: number;
  totalLines: number;
  overallOrderTotal: number;
  overallOpenBalance: number;
  openPoLines: number;
}

interface OrderItem {
  DocEntry: number;
  soNum: number;
  soDate: string;
  quoteNums: string;
  itemcode: string;
  name: string;
  orderedQty: number;
  openQty: number;
  lineStatus: 'Open' | 'Closed';
  lineTotal: number;
  openAmount: number;
  dcNums: string;
  invoiceNums: string;
  poNums: string;
  poStatus: 'Open' | 'Closed' | 'No PO';
  poOpenQty: number;
  U_Status: string;
  U_EDA: string;
  aging: number | null;
}

  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    totalOrders: 0,
    totalLines: 0,
    overallOrderTotal: 0,
    overallOpenBalance: 0,
    openPoLines: 0,
  });
  const [orderDetails, setOrderDetails] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  // 3. Load Pending Sales Orders ONLY when a Customer is selected
  useEffect(() => {
    if (!selectedCustomer) {
      setOrderSummary({
        totalOrders: 0,
        totalLines: 0,
        overallOrderTotal: 0,
        overallOpenBalance: 0,
        openPoLines: 0,
      });
      setOrderDetails([]);
      setLoadingOrders(false);
      return;
    }

    let active = true;
    async function loadOrders() {
      setLoadingOrders(true);
      const cardParam = `&cardCode=${encodeURIComponent(selectedCustomer!.Valmember)}`;

      try {
        const res = await fetch(`/api/dashboard?action=ORDERS${cardParam}`);
        const json = await res.json();
        if (!active) return;

        if (!res.ok || !json.success) {
          const msg =
            typeof json.message === 'string'
              ? json.message
              : JSON.stringify(json.message);
          setErrorMsg(msg || 'Failed to load pending orders.');
        } else {
          setOrderSummary(
            json.summary || {
              totalOrders: 0,
              totalLines: 0,
              overallOrderTotal: 0,
              overallOpenBalance: 0,
              openPoLines: 0,
            }
          );
          setOrderDetails(json.details || []);
        }
      } catch (err: unknown) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Error loading pending orders.');
        }
      } finally {
        if (active) setLoadingOrders(false);
      }
    }

    loadOrders();
    return () => {
      active = false;
    };
  }, [selectedCustomer]);

  //imvoices

  interface InvoiceSummary {
  totalInvoices: number;
  overdueInvoices: number;
  overallBilledTotal: number;
  overallPaidTotal: number;
  overallBalanceDue: number;
}

interface InvoiceItem {
  DocEntry: number;
  invNum: number;
  invDate: string;
  dueDate: string;
  docTotal: number;
  paidToDate: number;
  balanceDue: number;
  receiptNums: string;
  overdueDays: number;
}
const [invSummary, setInvSummary] = useState<InvoiceSummary>({
  totalInvoices: 0,
  overdueInvoices: 0,
  overallBilledTotal: 0,
  overallPaidTotal: 0,
  overallBalanceDue: 0,
});
const [invDetails, setInvDetails] = useState<InvoiceItem[]>([]);
const [loadingInvoices, setLoadingInvoices] = useState(false);
useEffect(() => {
  if (!selectedCustomer) {
    setInvSummary({
      totalInvoices: 0,
      overdueInvoices: 0,
      overallBilledTotal: 0,
      overallPaidTotal: 0,
      overallBalanceDue: 0,
    });
    setInvDetails([]);
    setLoadingInvoices(false);
    return;
  }

  let active = true;
  async function loadInvoices() {
    setLoadingInvoices(true);
    const cardParam = `&cardCode=${encodeURIComponent(selectedCustomer!.Valmember)}`;

    try {
      const res = await fetch(`/api/dashboard?action=INVOICES${cardParam}`);
      const json = await res.json();
      if (!active) return;

      if (res.ok && json.success) {
        setInvSummary(
          json.summary || {
            totalInvoices: 0,
            overdueInvoices: 0,
            overallBilledTotal: 0,
            overallPaidTotal: 0,
            overallBalanceDue: 0,
          }
        );
        setInvDetails(json.details || []);
      }
    } catch (err) {
      console.error('Error loading pending invoices:', err);
    } finally {
      if (active) setLoadingInvoices(false);
    }
  }

  loadInvoices();
  return () => {
    active = false;
  };
}, [selectedCustomer]);


  return (
    <Box
      minH="100vh"
      bgGradient="to-b"
      gradientFrom="#040d3a"
      gradientVia="#071966"
      gradientTo="#0f349c"
      color="white"
    >
      <AicNavbar />

      <Container maxW="7xl" py={8} px={{ base: 4, md: 8 }}>
        {/* Header & Searchable Customer Filter */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
          mb={6}
        >
          <Box>
            <Heading size="xl" fontWeight="bold" letterSpacing="tight">
              Customer Dashboard
            </Heading>
            <Text fontSize="sm" color="blue.200" mt={1}>
              {selectedCustomer
  ? 'No pending quotation items found for this customer.'
  : 'Please select a customer from the dropdown above to view customer summarynpm.'}

            </Text>
          </Box>

          {/* Searchable Dropdown */}
          <Box position="relative" w={{ base: 'full', md: '440px' }} ref={dropdownRef}>
            <Text fontSize="11px" fontWeight="bold" textTransform="uppercase" color="blue.200" mb={1}>
              Select Customer
            </Text>

            <Flex
              bg="white"
              color="gray.900"
              px={3.5}
              py={2.5}
              rounded="lg"
              align="center"
              justify="space-between"
              cursor="pointer"
              shadow="lg"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              {loadingCustomers ? (
                <HStack gap={2} color="gray.500">
                  <Spinner size="xs" />
                  <Text fontSize="sm">Loading customers...</Text>
                </HStack>
              ) : (
                <Text fontSize="sm" fontWeight="semibold" truncate>
                  {selectedCustomer
                    ? selectedCustomer.displaymember
                    : `All Customers (${customers.length})`}
                </Text>
              )}

              <HStack gap={1.5} flexShrink={0}>
                {selectedCustomer && (
                  <Box
                    as="span"
                    p={1}
                    rounded="full"
                    _hover={{ bg: 'red.50', color: 'red.600' }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedCustomer(null);
                      setSearchTerm('');
                    }}
                  >
                    <X size={14} />
                  </Box>
                )}
                <ChevronDown size={16} color="#051367" />
              </HStack>
            </Flex>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <Box
                position="absolute"
                right={0}
                mt={1.5}
                w="full"
                bg="white"
                color="gray.800"
                rounded="xl"
                shadow="2xl"
                border="1px solid"
                borderColor="gray.200"
                zIndex={40}
                overflow="hidden"
              >
                {/* Search Input */}
                <Box p={2.5} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                  <Flex align="center" bg="white" px={2.5} rounded="md" border="1px solid" borderColor="gray.300">
                    <Search size={15} color="#64748b" />
                    <Input
                      autoFocus
                      size="sm"
                      border="none"
                      _focus={{ boxShadow: 'none' }}
                      placeholder="Type customer name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Flex>
                </Box>

                {/* Options List */}
                <Box maxH="280px" overflowY="auto">
                  <Flex
                    px={4}
                    py={2.5}
                    justify="space-between"
                    align="center"
                    cursor="pointer"
                    bg={!selectedCustomer ? 'blue.50' : 'white'}
                    _hover={{ bg: 'blue.50' }}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="#051367">
                      All Customers
                    </Text>
                    <Badge colorPalette="blue">{customers.length}</Badge>
                  </Flex>

                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.Valmember === cust.Valmember;
                    return (
                      <Flex
                        key={cust.Valmember}
                        px={4}
                        py={2.5}
                        justify="space-between"
                        align="center"
                        gap={3}
                        cursor="pointer"
                        borderTop="1px solid"
                        borderColor="gray.100"
                        bg={isSelected ? 'blue.50' : 'white'}
                        _hover={{ bg: 'blue.50' }}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text fontSize="sm" fontWeight={isSelected ? 'bold' : 'medium'} truncate>
                          {cust.displaymember}
                        </Text>
                        <Badge variant="subtle" fontFamily="mono" flexShrink={0}>
                          {cust.Valmember}
                        </Badge>
                      </Flex>
                    );
                  })}

                  {filteredCustomers.length === 0 && (
                    <Text py={6} textAlign="center" fontSize="xs" color="gray.400">
                      No matching customer found
                    </Text>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Flex>

        {/* Error Display (if any) */}
        {errorMsg && (
          <Box bg="red.50" color="red.700" p={3.5} rounded="lg" mb={6} fontSize="sm">
            {errorMsg}
          </Box>
        )}

        {/* Active Filter Confirmation Banner */}
        <Box bg="white/10" border="1px solid" borderColor="white/20" rounded="xl" p={5}>
          <Text fontSize="xs" textTransform="uppercase" color="blue.200" fontWeight="bold">
            Active Customer Filter Parameter (@CardCode)
          </Text>
          <Text fontSize="lg" fontWeight="bold" mt={1}>
            {selectedCustomer
              ? `${selectedCustomer.displaymember} — Value: ${selectedCustomer.Valmember}`
              : 'All Customers (NULL)'}
          </Text>
        </Box>


{/* quotations */}

<Box mb={8}>
  {/* Overall Pending Quotation Summary Box */}
{/* ========================================================================
    ROW 1: SUMMARY CARDS (Directly inside <Container>, no outer white Box!)
   ======================================================================== */}
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5} mb={6} w="full">
  {/* Card 1: Pending Quotations */}
  <Box
    bg="white"
    color="gray.800"
    p={5}
    rounded="xl"
    shadow="xl"
    borderLeft="6px solid #051367"
  >
    <Flex justify="space-between" align="center" gap={2} wrap="wrap" mb={2}>
      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
        Pending Quotations
      </Text>
      <Badge bg="#eef1fb" color="#051367" px={2.5} py={0.5} rounded="full">
        {quoteSummary.totalQuotes} Quotes • {quoteSummary.totalLines} Items
      </Badge>
    </Flex>

    <Text fontSize="2xl" fontWeight="extrabold" color="#051367">
      {formatINR(quoteSummary.overallOpenTotal)}
    </Text>
    <Text fontSize="xs" color="gray.500" mt={1} truncate>
      {selectedCustomer ? selectedCustomer.displaymember : 'Select a customer'}
    </Text>
  </Box>

  
{/* Card 2: Pending Sales Orders */}
<Box
  bg="white"
  color="gray.800"
  p={5}
  rounded="xl"
  shadow="xl"
  borderLeft="6px solid #059669"
>
  <Flex justify="space-between" align="center" gap={2} wrap="wrap" mb={2}>
    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
      Pending Sales Orders (Open Balance)
    </Text>
    <HStack gap={1.5} wrap="wrap">
      <Badge colorPalette="green" px={2.5} py={0.5} rounded="full">
        {orderSummary.totalOrders} SOs • {orderSummary.totalLines} Items
      </Badge>
      <Badge colorPalette="orange" px={2.5} py={0.5} rounded="full">
        {orderSummary.openPoLines} Open PO
      </Badge>
    </HStack>
  </Flex>

  {/* Primary Figure: Pending Open Balance Only (₹4,12,554.85) */}
  <Text fontSize="3xl" fontWeight="extrabold" color="#051367" lineHeight="shorter">
    {formatINR(orderSummary.overallOpenBalance)}
  </Text>

  {/* Secondary Figure: Larger Total Order Value (₹5,66,050.35) */}
  <Flex align="center" gap={1.5} mt={2} pt={1.5} borderTop="1px solid" borderColor="gray.100">
    <Text fontSize="xs" fontWeight="semibold" color="gray.500">
      Total Order Value:
    </Text>
    <Text fontSize="sm" fontWeight="bold" color="gray.800">
      {formatINR(orderSummary.overallOrderTotal)}
    </Text>
  </Flex>
</Box>


  {/* Card 3: Pending A/R Invoices & Received Payments */}
<Box
  bg="white"
  color="gray.800"
  p={5}
  rounded="xl"
  shadow="xl"
  borderLeft="6px solid #d97706"
>
  <Flex justify="space-between" align="center" gap={2} wrap="wrap" mb={2}>
    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
      Pending Invoices (Balance Due)
    </Text>
    <HStack gap={1.5} wrap="wrap">
      <Badge colorPalette="orange" px={2.5} py={0.5} rounded="full">
        {invSummary.totalInvoices} Invoices
      </Badge>
      {invSummary.overdueInvoices > 0 && (
        <Badge colorPalette="red" px={2.5} py={0.5} rounded="full">
          {invSummary.overdueInvoices} Overdue
        </Badge>
      )}
    </HStack>
  </Flex>

  <Text fontSize="2xl" fontWeight="extrabold" color="red.600">
    {formatINR(invSummary.overallBalanceDue)}
  </Text>
  <Text fontSize="xs" color="gray.500" mt={1}>
    Billed: <strong>{formatINR(invSummary.overallBilledTotal)}</strong> • Received:{' '}
    <strong style={{ color: '#059669' }}>{formatINR(invSummary.overallPaidTotal)}</strong>
  </Text>
</Box>

</SimpleGrid>

  {/* Pending Quotation Details Table */}
  <Box bg="white" color="gray.800" rounded="xl" shadow="2xl" overflow="hidden">


    {loadingQuotes ? (
      <Flex py={12} justify="center" align="center" gap={3} color="#051367">
        <Spinner size="sm" />
        <Text fontSize="sm" fontWeight="medium">Fetching open quotations from SAP HANA...</Text>
      </Flex>
    ) : (
      <Box overflowX="auto" maxH="420px" overflowY="auto">
        <Table.Root size="sm">
          <Table.Header bg="gray.50" position="sticky" top={0} zIndex={1}>
            <Table.Row>
              <Table.ColumnHeader py={3} px={4} color="#051367">Quote #</Table.ColumnHeader>
              <Table.ColumnHeader color="#051367">Item Code</Table.ColumnHeader>
              <Table.ColumnHeader color="#051367">Item Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end" color="#051367">Open Qty</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end" color="#051367">Open Total</Table.ColumnHeader>
              <Table.ColumnHeader px={4} textAlign="center" color="#051367">Aging (Days)</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {quoteDetails.map((row, idx) => (
              <Table.Row key={`${row.DocEntry}-${row.itemcode}-${idx}`} _hover={{ bg: 'blue.50/40' }}>
                <Table.Cell py={3} px={4} fontWeight="bold" color="#051367">
                  {row.DocNum}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="semibold">
                  {row.itemcode}
                </Table.Cell>
                <Table.Cell maxW="320px" truncate title={row.name}>
                  {row.name}
                </Table.Cell>
                <Table.Cell textAlign="end" fontWeight="medium">
                  {Number(row.openqty || 0).toLocaleString('en-IN')}
                </Table.Cell>
                <Table.Cell textAlign="end" fontWeight="bold">
                  ₹{Number(row.opentotal || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Table.Cell>
                <Table.Cell px={4} textAlign="center">
                  <Badge
                    colorPalette={row.aging > 30 ? 'red' : row.aging > 15 ? 'orange' : 'green'}
                    variant="subtle"
                  >
                    {row.aging} days
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}

            {quoteDetails.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6} py={10} textAlign="center" color="gray.400">
                  No pending quotation items found for this customer.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    )}
  </Box></Box>

        {/* Pending Sales Orders Item Details Table */}
<Box bg="white" color="gray.800" rounded="xl" shadow="2xl" overflow="hidden" mb={8}>
  <Flex
    px={5}
    py={3.5}
    bg="gray.50"
    borderBottom="1px solid"
    borderColor="gray.200"
    justify="space-between"
    align="center"
  >
    <Text fontSize="sm" fontWeight="bold" color="#051367">
      Pending Order Item Details (Open & Closed Lines + DC, Invoice & Linked PO)
    </Text>
    <Badge colorPalette="green">{orderDetails.length} Rows</Badge>
  </Flex>

  {loadingOrders ? (
    <Flex py={12} justify="center" align="center" gap={3} color="#051367">
      <Spinner size="sm" />
      <Text fontSize="sm" fontWeight="medium">
        Fetching pending sales orders from SAP HANA...
      </Text>
    </Flex>
  ) : (
    <Box overflowX="auto" maxH="460px" overflowY="auto">
      <Table.Root size="sm">
        <Table.Header bg="gray.50" position="sticky" top={0} zIndex={1}>
          <Table.Row>
            <Table.ColumnHeader py={3} px={4} color="#051367">SO #</Table.ColumnHeader>
<Table.ColumnHeader color="#051367">Quote #</Table.ColumnHeader>

            <Table.ColumnHeader color="#051367">Item Code</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">Item Name</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" color="#051367">Line Status</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">Ord / Open Qty</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">Open Total</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">DC #</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">Invoice #</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">PO #</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" color="#051367">PO Status</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">PO Open Qty</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" color="#051367">Quote Status</Table.ColumnHeader>
<Table.ColumnHeader textAlign="center" color="#051367">EDA</Table.ColumnHeader>

            <Table.ColumnHeader px={4} textAlign="center" color="#051367">Aging</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {orderDetails.map((row, idx) => {
            const isClosed = row.lineStatus === 'Closed';
            return (
              <Table.Row
                key={`${row.DocEntry}-${row.itemcode}-${idx}`}
                bg={isClosed ? 'gray.50/80' : 'white'}
                _hover={{ bg: 'blue.50/40' }}
              >
                <Table.Cell py={3} px={4} fontWeight="bold" color="green.700">
  {row.soNum}
</Table.Cell>
<Table.Cell fontFamily="mono" fontSize="xs" fontWeight="bold" color="#051367">
  {row.quoteNums || '-'}
</Table.Cell>

                <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="semibold">
                  {row.itemcode}
                </Table.Cell>
                <Table.Cell maxW="240px" truncate title={row.name}>
                  {row.name}
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Badge colorPalette={isClosed ? 'gray' : 'green'} variant="subtle">
                    {row.lineStatus}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="end" fontSize="xs">
                  {Number(row.orderedQty || 0)} / <strong>{Number(row.openQty || 0)}</strong>
                </Table.Cell>
                <Table.Cell textAlign="end" fontWeight="bold">
                  {formatINR(row.openAmount)}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" color="gray.700">
                  {row.dcNums || '-'}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="bold" color="#051367">
                  {row.invoiceNums || '-'}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="bold" color="purple.700">
                  {row.poNums || '-'}
                </Table.Cell>
                
                <Table.Cell textAlign="center">
                  <Badge
                    colorPalette={
                      row.poStatus === 'Open'
                        ? 'orange'
                        : row.poStatus === 'Closed'
                        ? 'green'
                        : 'gray'
                    }
                    variant="subtle"
                  >
                    {row.poStatus}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="end" fontWeight="semibold">
                  {row.poStatus === 'No PO'
                    ? '-'
                    : Number(row.poOpenQty || 0).toLocaleString('en-IN')}
                </Table.Cell>
                <Table.Cell textAlign="center">
  <Badge colorPalette="purple" variant="subtle">
    {row.U_Status || '-'}
  </Badge>
</Table.Cell>
<Table.Cell textAlign="center" fontSize="xs" fontWeight="medium">
  {row.U_EDA || '-'}
</Table.Cell>

                <Table.Cell px={4} textAlign="center">
                  {isClosed || row.aging === null ? (
                    <Text fontSize="xs" color="gray.400">
                      -
                    </Text>
                  ) : (
                    <Badge colorPalette={row.aging > 30 ? 'red' : 'blue'} variant="subtle">
                      {row.aging}d
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}

          {orderDetails.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={12} py={10} textAlign="center" color="gray.400">
                {selectedCustomer
                  ? 'No pending sales orders found for this customer.'
                  : 'Please select a customer from the dropdown above to view pending orders.'}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  )}
</Box>

{/* ========================================================================
    PENDING A/R INVOICES & RECEIVED PAYMENTS TABLE
   ======================================================================== */}
<Box bg="white" color="gray.800" rounded="xl" shadow="2xl" overflow="hidden" mb={8}>
  <Flex
    px={5}
    py={3.5}
    bg="gray.50"
    borderBottom="1px solid"
    borderColor="gray.200"
    justify="space-between"
    align="center"
  >
    <Text fontSize="sm" fontWeight="bold" color="#051367">
      Pending A/R Invoices & Payment Receipts
    </Text>
    <Badge colorPalette="orange">{invDetails.length} Open Invoices</Badge>
  </Flex>

  {loadingInvoices ? (
    <Flex py={12} justify="center" align="center" gap={3} color="#051367">
      <Spinner size="sm" />
      <Text fontSize="sm" fontWeight="medium">
        Fetching pending invoices & payment receipts from SAP HANA...
      </Text>
    </Flex>
  ) : (
    <Box overflowX="auto" maxH="400px" overflowY="auto">
      <Table.Root size="sm">
        <Table.Header bg="gray.50" position="sticky" top={0} zIndex={1}>
          <Table.Row>
            <Table.ColumnHeader py={3} px={4} color="#051367">Invoice #</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">Invoice Date</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">Due Date</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">Invoice Total</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">Payment Received</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" color="#051367">Balance Due</Table.ColumnHeader>
            <Table.ColumnHeader color="#051367">Receipt #</Table.ColumnHeader>
            <Table.ColumnHeader px={4} textAlign="center" color="#051367">Status / Overdue</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invDetails.map((inv) => {
            const hasPartialPayment = Number(inv.paidToDate) > 0;
            return (
              <Table.Row key={inv.DocEntry} _hover={{ bg: 'blue.50/40' }}>
                <Table.Cell py={3} px={4} fontWeight="bold" color="#051367">
                  {inv.invNum}
                </Table.Cell>
                <Table.Cell>{inv.invDate}</Table.Cell>
                <Table.Cell>{inv.dueDate}</Table.Cell>
                <Table.Cell textAlign="end">{formatINR(inv.docTotal)}</Table.Cell>
                <Table.Cell textAlign="end" fontWeight="semibold" color="green.700">
                  {formatINR(inv.paidToDate)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontWeight="bold" color="red.600">
                  {formatINR(inv.balanceDue)}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="semibold" color="purple.700">
                  {inv.receiptNums || '-'}
                </Table.Cell>
                <Table.Cell px={4} textAlign="center">
                  <HStack justify="center" gap={1.5}>
                    {hasPartialPayment && (
                      <Badge colorPalette="green" variant="subtle">
                        Partial Paid
                      </Badge>
                    )}
                    {inv.overdueDays > 0 ? (
                      <Badge colorPalette="red" variant="subtle">
                        {inv.overdueDays}d Overdue
                      </Badge>
                    ) : (
                      <Badge colorPalette="blue" variant="subtle">
                        Within Due
                      </Badge>
                    )}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            );
          })}

          {invDetails.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={8} py={10} textAlign="center" color="gray.400">
                {selectedCustomer
                  ? 'No pending invoices found for this customer.'
                  : 'Please select a customer from the dropdown above to view pending invoices.'}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  )}
</Box>

      </Container>
    </Box>
    
  );
}
