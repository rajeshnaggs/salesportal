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
  Spinner,
  Table,
  SimpleGrid,
  Button,VStack
} from '@chakra-ui/react';
import { Search, ChevronDown, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AicNavbar from '@/app/components/AicNavbar';

type FilterMode = 'FULL' | 'CUSTOMER' | 'ITEM' | 'PO' | 'CUSTOMER GROUP';
type StageFilter = 'ALL' | 'PENDING' | 'INVOICED' | 'OVERDUE';

interface CustomerOption {
  displaymember: string;
  Valmember: string;
}

interface UnifiedRow {
  DocEntry: number;
  cardCode: string;
  cardName: string;
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
  poNums: string;
  poStatus: 'Open' | 'Closed' | 'No PO';
  poOpenQty: number;
  U_Status: string;
  U_EDA: string;
  dcNums: string;
  invoiceNums: string;
  invDate: string;
  dueDate: string;
  billedAmount: number;
  paidAmount: number;
  balanceDue: number;
  receiptNums: string;
  overdueDays: number;
  aging: number | null;
  numAtCard  : string;
  reason?: string;
remarks?: string;
approvalStatus?: 'Approved' | 'Disapproved' | 'Hold' | 'Pending' | string;
itemOpenPOs?: string;
itemTotalPOOpenQty?:string;
}

export default function CustomerDashboardPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>('FULL');
  const [stageFilter, setStageFilter] = useState<StageFilter>('PENDING');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const dropdownRef = useRef<HTMLDivElement>(null);
const [customerGroups, setCustomerGroups] = useState<CustomerOption[]>([]);
const [selectedGroup, setSelectedGroup] = useState<CustomerOption | null>(null);



  const formatINR = (val: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

    

    
  
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard?action=CUSTOMER_GROUPS')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCustomerGroups(res.data || []);
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    fetch('/api/dashboard?action=CUSTOMERS')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCustomers(json.data || []);
      })
      .catch(() => setErrorMsg('Unable to load customers.'))
      .finally(() => setLoadingCustomers(false));
  }, []);

const [defaultFY, setDefaultFY] = useState<{ fromDate: string; toDate: string }>({
  fromDate: '',
  toDate: '',
});
const [fromDate, setFromDate] = useState<string>('');
const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    if (filterMode === 'CUSTOMER' && !selectedCustomer) return;
    if (filterMode === 'CUSTOMER GROUP' && !selectedGroup) return;
    if ((filterMode === 'ITEM' || filterMode === 'PO') && !searchTerm.trim()) return;
    if (filterMode === 'FULL' && rows.length > 0 && searchTerm.trim()) return;

    let active = true;
    const timer = setTimeout(async () => {
      setLoadingData(true);
      setErrorMsg('');
      const params = new URLSearchParams({
        action: 'UNIFIED_REPORT',
        mode: filterMode,
        stage: stageFilter,
      });

      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      if (filterMode === 'CUSTOMER' && selectedCustomer) {
        params.set('value', selectedCustomer.Valmember);
      } else if (filterMode === 'CUSTOMER GROUP' && selectedGroup) {
        params.set('value', selectedGroup.Valmember);
      } else if (filterMode === 'ITEM' || filterMode === 'PO') {
        params.set('value', searchTerm.trim());
      }

      try {
        const res = await fetch(`/api/dashboard?${params.toString()}`);
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.success) {
          setErrorMsg(json.message || 'Failed to load report.');
          setRows([]);
        } else {
          setRows(json.details || []);
        }
      } catch {
        if (active) setErrorMsg('Network error loading report.');
      } finally {
        if (active) setLoadingData(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filterMode, stageFilter, selectedCustomer, selectedGroup, searchTerm, fromDate, toDate]);



  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const list = !q
      ? customers
      : customers.filter(
          (c) =>
            c.displaymember?.toLowerCase().includes(q) ||
            c.Valmember?.toLowerCase().includes(q)
        );
    return list.slice(0, 100);
  }, [customers, searchTerm]);

  const displayedRows = useMemo(() => {
    let list = rows;
    if (filterMode === 'FULL' && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          String(r.soNum).includes(q) ||
          r.numAtCard?.toLowerCase().includes(q) ||
          r.poNums?.toLowerCase().includes(q) ||
          r.cardName?.toLowerCase().includes(q) ||
          r.itemcode?.toLowerCase().includes(q) ||
          r.name?.toLowerCase().includes(q)
      );
    }
    if (stageFilter === 'PENDING') {
      return list.filter((r) => r.lineStatus === 'Open' || Number(r.balanceDue || 0) > 0);
    }
    if (stageFilter === 'INVOICED') {
      return list.filter((r) => Boolean(r.invoiceNums && r.invoiceNums !== '-'));
    }
    if (stageFilter === 'OVERDUE') {
      return list.filter(
        (r) => Number(r.overdueDays || 0) > 0 && Number(r.balanceDue || 0) > 0
      );
    }
    return list;
  }, [rows, filterMode, searchTerm, stageFilter]);

  
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayedRows.slice(start, start + PAGE_SIZE);
  }, [displayedRows, page]);

  const insights = useMemo(() => {
    let totalOrder = 0, openOrder = 0, billed = 0, paid = 0, due = 0, overdue = 0;
    const soSet = new Set<number>();
    const openPoSet = new Set<string>();
    const seenInvoices = new Set<string>();


    let overdueAmount = 0;

    displayedRows.forEach((r) => {
      soSet.add(r.soNum);
      totalOrder += Number(r.lineTotal || 0);
      openOrder += Number(r.openAmount || 0);
      billed += Number(r.billedAmount || 0);
      paid += Number(r.paidAmount || 0);
      due += Number(r.balanceDue || 0);

      if (r.poNums && r.poNums !== '-' && r.poStatus === 'Open') {
        openPoSet.add(r.poNums);
      }

      if (Number(r.overdueDays || 0) > 0 && Number(r.balanceDue || 0) > 0) {
        overdueAmount += Number(r.balanceDue || 0);
        if (r.invoiceNums && r.invoiceNums !== '-' && !seenInvoices.has(r.invoiceNums)) {
          seenInvoices.add(r.invoiceNums);
          overdue++;
        }
      }
    });



      return {
      soCount: soSet.size,
      lineCount: displayedRows.length,
      totalOrder,
      openOrder,
      billed,
      paid,
      due,
      openPo: openPoSet.size,
      overdue,
      overdueAmount,
      collectionPct: billed > 0 ? Math.min(100, Math.round((paid / billed) * 100)) : 0,
    };

  }, [displayedRows]);

  const handleExportXLSX = () => {
    if (!displayedRows.length) return;
    const sheetData = displayedRows.map((r) => ({
      'Customer Code': r.cardCode,
      'Customer Name': r.cardName,
      'SO #': r.soNum,
      'SO Date': r.soDate,
      'Quote #': r.quoteNums || '-',
      'Item Code': r.itemcode,
      'Item Name': r.name,
      'Line Status': r.lineStatus,
      'Ord Qty': r.orderedQty,
      'Open Qty': r.openQty,
      'Order Total': r.lineTotal,
      'Open Amt': r.openAmount,
      'PO #': r.poNums || '-',
      'PO Status': r.poStatus,
      'PO Open Qty': r.poStatus === 'No PO' ? 0 : r.poOpenQty,
      'Status': r.U_Status || '-',
      'ETA / EDA': r.U_EDA || '-',
      'DC #': r.dcNums || '-',
      'Invoice #': r.invoiceNums || '-',
      'Billed Total': r.billedAmount,
      'Paid Amount': r.paidAmount,
      'Balance Due': r.balanceDue,
      'Receipt #': r.receiptNums || '-',
      'Overdue Days': r.overdueDays,
      'Aging (Days)': r.aging ?? '-',
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order_To_Payment');
    XLSX.writeFile(wb, `Order_To_Payment_${filterMode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  
const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'INVOICED' | 'OVERDUE'>('ALL');

// 1. Unique Customer Groups derived from loaded rows


// 2. Apply Customer Group + Tab Filter
const filteredRows = useMemo(() => {
  return rows.filter((r) => {
    const matchesGroup = selectedGroup === 'ALL' || r.groupName === selectedGroup;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? Number(r.openQty) > 0
        : statusFilter === 'INVOICED'
        ? Number(r.billedAmt) > 0
        : Number(r.overdueDays) > 0 && Number(r.balanceDue) > 0;

    return matchesGroup && matchesStatus;
  });
}, [rows, selectedGroup, statusFilter]);

// 3. Overdue KPI Totals
const overdueStats = useMemo(() => {
  const overdueItems = rows.filter(
    (r) =>
      (selectedGroup === 'ALL' || r.groupName === selectedGroup) &&
      Number(r.overdueDays) > 0 &&
      Number(r.balanceDue) > 0
  );
  const uniqueInvoices = new Set(overdueItems.map((i) => i.invoiceNum)).size;
  const totalOverdue = overdueItems.reduce((sum, i) => sum + Number(i.balanceDue || 0), 0);
  return { uniqueInvoices, totalOverdue };
}, [rows, selectedGroup]);

const filteredGroups = useMemo(() => {
  const q = searchTerm.toLowerCase().trim();
  if (!q) return customerGroups;
  return customerGroups.filter(
    (g) =>
      g.displaymember?.toLowerCase().includes(q) ||
      g.Valmember?.toLowerCase().includes(q)
  );
}, [customerGroups, searchTerm]);




// 1. Invoice-level aggregated rows for Overdue
const overdueInvoiceRows = useMemo(() => {
  const map = new Map<
    string,
    {
      invoiceNum: string;
      invDate: string;
      dueDate: string;
      cardCode: string;
      cardName: string;
      soNums: Set<string>;
      soDates: Set<string>;
      custRefs: Set<string>;
      dcNums: Set<string>;
      overdueDays: number;
      balanceDue: number;
      billedAmount: number;
      paidAmount: number;
    }
  >();

  rows.forEach((r) => {
    const isOverdue =
      r.invoiceNums &&
      r.invoiceNums !== '-' &&
      (Number(r.overdueDays) > 0 || Number(r.balanceDue) > 0);

    if (!isOverdue) return;

    const invKey = String(r.invoiceNums);
    const existing = map.get(invKey);

    if (!existing) {
      map.set(invKey, {
        invoiceNum: invKey,
        invDate: r.invDate || '-',
        dueDate: r.dueDate || '-',
        cardCode: r.cardCode,
        cardName: r.cardName,
        soNums: new Set(r.soNum ? [String(r.soNum)] : []),
        soDates: new Set(r.soDate ? [r.soDate] : []),
        custRefs: new Set(r.numAtCard && r.numAtCard !== '-' ? [r.numAtCard] : []),
        dcNums: new Set(r.dcNums && r.dcNums !== '-' ? [String(r.dcNums)] : []),
        overdueDays: Number(r.overdueDays) || 0,
        balanceDue: Number(r.balanceDue) || 0,
        billedAmount: Number(r.billedAmount) || 0,
        paidAmount: Number(r.paidAmount) || 0,
      });
    } else {
      if (r.soNum) existing.soNums.add(String(r.soNum));
      if (r.soDate) existing.soDates.add(r.soDate);
      if (r.numAtCard && r.numAtCard !== '-') existing.custRefs.add(r.numAtCard);
      if (r.dcNums && r.dcNums !== '-') existing.dcNums.add(String(r.dcNums));
      existing.overdueDays = Math.max(existing.overdueDays, Number(r.overdueDays) || 0);
      existing.balanceDue += Number(r.balanceDue) || 0;
      existing.billedAmount += Number(r.billedAmount) || 0;
      existing.paidAmount += Number(r.paidAmount) || 0;
    }
  });

  return Array.from(map.values()).sort((a, b) => b.overdueDays - a.overdueDays);
}, [rows]);



const filteredOverdueRows = useMemo(() => {
  if (!searchTerm.trim() || filterMode !== 'FULL') return overdueInvoiceRows;
  const q = searchTerm.toLowerCase();
  return overdueInvoiceRows.filter(
    (inv) =>
      inv.cardName?.toLowerCase().includes(q) ||
      inv.cardCode?.toLowerCase().includes(q) ||
      inv.invoiceNum?.toLowerCase().includes(q) ||
      Array.from(inv.soNums).some((s) => s.toLowerCase().includes(q)) ||
      Array.from(inv.custRefs).some((c) => c.toLowerCase().includes(q)) ||
      Array.from(inv.dcNums).some((d) => d.toLowerCase().includes(q))
  );
}, [overdueInvoiceRows, searchTerm, filterMode]);

const activeRowCount =
  stageFilter === 'OVERDUE' ? filteredOverdueRows.length : displayedRows.length;

const totalPages = Math.max(1, Math.ceil(activeRowCount / PAGE_SIZE));



const paginatedOverdueRows = useMemo(() => {
  const start = (page - 1) * PAGE_SIZE;
  return filteredOverdueRows.slice(start, start + PAGE_SIZE);
}, [filteredOverdueRows, page]);



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
        {/* Header & XLSX Export Button */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
          mb={6}
        >
          <Box>
            <Heading size="xl" fontWeight="bold" letterSpacing="tight">
              Sales Order to Payment Dashboard
            </Heading>
            <Text fontSize="sm" color="blue.200" mt={1}>
              Unified pipeline tracking from Sales Order & PO procurement to Delivery, Invoice, and Payment.
            </Text>
          </Box>

          <Button
            bg="#059669"
            color="white"
            _hover={{ bg: '#047857' }}
            size="md"
            rounded="lg"
            shadow="lg"
            onClick={handleExportXLSX}
            disabled={displayedRows.length === 0 || loadingData}
          >
            <Download size={16} />
            Export XLSX ({displayedRows.length})
          </Button>
        </Flex>
<Flex>
  <HStack gap={2} bg="whiteAlpha.100" px={3} py={1.5} rounded="lg" borderWidth="1px" borderColor="whiteAlpha.200">
  <Text fontSize="xs" color="whiteAlpha.800" fontWeight="medium">From</Text>
  <Input
    type="date"
    size="xs"
    w="125px"
    bg="white"
    color="gray.800"
    rounded="md"
    value={fromDate}
    max={toDate}
    onChange={(e) => setFromDate(e.target.value)}
  />
  <Text fontSize="xs" color="whiteAlpha.800" fontWeight="medium">To</Text>
  <Input
    type="date"
    size="xs"
    w="125px"
    bg="white"
    color="gray.800"
    rounded="md"
    value={toDate}
    min={fromDate}
    onChange={(e) => setToDate(e.target.value)}
  />
  {(fromDate !== defaultFY.fromDate || toDate !== defaultFY.toDate) && (
    <Button
      size="xs"
      variant="ghost"
      color="white"
      _hover={{ bg: 'whiteAlpha.200' }}
      onClick={() => {
        setFromDate(defaultFY.fromDate);
        setToDate(defaultFY.toDate);
      }}
      title="Reset to Current FY (1st Apr - Today)"
    >
     
    </Button>
  )}
</HStack>

</Flex>
        {/* 4-Mode Filter Bar */}
        <Box bg="white/10" border="1px solid" borderColor="white/20" rounded="xl" p={4} mb={6}>
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', lg: 'center' }}
            gap={4}
          >
            <HStack gap={2} wrap="wrap">
              {(
                [
                  { id: 'FULL', label: 'Full Report' },
                  { id: 'CUSTOMER', label: 'Customer Wise' },
                  { id: 'CUSTOMER GROUP', label: 'Customer Group' },
                  { id: 'ITEM', label: 'Item Wise' },
                  { id: 'PO', label: 'PO #' },
                ] as { id: FilterMode; label: string }[]
              ).map((tab) => {
                const active = filterMode === tab.id;
                return (
                  <Button
                    key={tab.id}
                    size="sm"
                    rounded="lg"
                    bg={active ? 'white' : 'white/10'}
                    color={active ? '#051367' : 'white'}
                    fontWeight="bold"
                    _hover={{ bg: active ? 'white' : 'white/20' }}
                    onClick={() => {
                      setFilterMode(tab.id);
                      setSearchTerm('');
                      setDropdownOpen(tab.id === 'CUSTOMER');
                      if (tab.id !== 'CUSTOMER') setSelectedCustomer(null);
                    }}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </HStack>

            <Box w={{ base: 'full', lg: '440px' }} position="relative" ref={dropdownRef}>
              {filterMode === 'CUSTOMER' ? (
                <Box>
                  <Flex
                    bg="white"
                    color="gray.900"
                    px={3.5}
                    py={2}
                    rounded="lg"
                    align="center"
                    justify="space-between"
                    cursor="pointer"
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
                          ? `${selectedCustomer.displaymember} (${selectedCustomer.Valmember})`
                          : 'Click to select customer...'}
                      </Text>
                    )}
                    <HStack gap={1}>
                      {selectedCustomer && (
                        <X
                          size={14}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(null);
                            setRows([]);
                          }}
                        />
                      )}
                      <ChevronDown size={16} color="#051367" />
                    </HStack>
                  </Flex>

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
                      zIndex={40}
                      overflow="hidden"
                    >
                      <Box p={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                        <Input
                          autoFocus
                          size="sm"
                          placeholder="Type customer name or CardCode..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Box>
                      <Box maxH="240px" overflowY="auto">
                        {filteredCustomers.map((c) => (
                          <Flex
                            key={c.Valmember}
                            px={3.5}
                            py={2}
                            justify="space-between"
                            align="center"
                            cursor="pointer"
                            _hover={{ bg: 'blue.50' }}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text fontSize="sm" truncate>{c.displaymember}</Text>
                            <Badge variant="subtle" fontFamily="mono">{c.Valmember}</Badge>
                          </Flex>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )  : filterMode === 'CUSTOMER GROUP' ? (
  /* Customer Group Dropdown */
  <Box position="relative" w={{ base: 'full', md: '360px' }}>
    <Flex
      bg="white"
      color="gray.900"
      px={3.5}
      py={2}
      rounded="lg"
      align="center"
      justify="space-between"
      cursor="pointer"
      onClick={() => setGroupDropdownOpen((o) => !o)}
    >
      <Text fontSize="sm" fontWeight="semibold" truncate>
        {selectedGroup
          ? selectedGroup.displaymember
          : `Select Customer Group (${customerGroups.length})`}
      </Text>
      <HStack gap={1.5}>
        {selectedGroup && (
          <X
            size={14}
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGroup(null);
              setSearchTerm('');
            }}
          />
        )}
        <ChevronDown size={15} color="#051367" />
      </HStack>
    </Flex>

    {groupDropdownOpen && (
      <Box
        position="absolute"
        right={0}
        mt={1.5}
        w="full"
        bg="white"
        color="gray.800"
        rounded="xl"
        shadow="2xl"
        zIndex={40}
        overflow="hidden"
      >
        <Box p={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
          <Input
            autoFocus
            size="sm"
            placeholder="Type customer group name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Box maxH="240px" overflowY="auto">
          {filteredGroups.map((grp) => (
            <Flex
              key={grp.Valmember}
              px={3.5}
              py={2}
              justify="space-between"
              align="center"
              cursor="pointer"
              borderTop="1px solid"
              borderColor="gray.100"
              bg={selectedGroup?.Valmember === grp.Valmember ? 'blue.50' : 'white'}
              _hover={{ bg: 'blue.50' }}
              onClick={() => {
                setSelectedGroup(grp);
                setGroupDropdownOpen(false);
              }}
            >
              <Text fontSize="sm" truncate>{grp.displaymember}</Text>
              <Badge variant="subtle" fontFamily="mono">{grp.Valmember}</Badge>
            </Flex>
          ))}
          {filteredGroups.length === 0 && (
            <Text py={4} textAlign="center" fontSize="xs" color="gray.400">
              No customer groups loaded
            </Text>
          )}
        </Box>
      </Box>
    )}
  </Box>
): (
                <Flex bg="white" color="gray.900" px={3} rounded="lg" align="center">
                  <Search size={15} color="#64748b" />
                  <Input
                    key={filterMode}
                    autoFocus={filterMode !== 'FULL'}
                    size="sm"
                    border="none"
                    _focus={{ boxShadow: 'none' }}
                    placeholder={
                      filterMode === 'ITEM'
                        ? 'Type Item Code or Item Name...'
                        : filterMode === 'PO'
                        ? 'Type Purchase Order (PO #)...'
                        : 'Quick filter by SO #, PO #, Customer, or Item...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <X size={14} cursor="pointer" onClick={() => setSearchTerm('')} />
                  )}

               

                </Flex>

                
              )}
            </Box>
          </Flex>
        </Box>

        {errorMsg && (
          <Box bg="red.50" color="red.700" p={3.5} rounded="lg" mb={6} fontSize="sm">
            {errorMsg}
          </Box>
        )}

        {/* 4 High-Level Executive KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={5} mb={6} w="full">
          <Box bg="white" color="gray.800" p={5} rounded="xl" shadow="xl" borderLeft="6px solid #051367">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
                Total Order Book
              </Text>
              <Badge colorPalette="blue" px={2.5} py={0.5} rounded="full">
                {insights.soCount} SOs • {insights.lineCount} Lines
              </Badge>
            </Flex>
            <Text fontSize="2xl" fontWeight="extrabold" color="#051367">
              {formatINR(insights.totalOrder)}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Gross confirmed sales order value
            </Text>
          </Box>

          <Box bg="white" color="gray.800" p={5} rounded="xl" shadow="xl" borderLeft="6px solid #059669">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
                Pending Order Value
              </Text>
              <Badge colorPalette="orange" px={2.5} py={0.5} rounded="full">
                {insights.openPo} Open POs
              </Badge>
            </Flex>
            <Text fontSize="2xl" fontWeight="extrabold" color="green.700">
              {formatINR(insights.openOrder)}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Unbilled / awaiting delivery & PO ETA
            </Text>
          </Box>

      {/* Card 3: Total Invoiced & Collected */}
{/* Card 3: Total Invoiced, Collected & Total Due */}
<Box
  as="button"
  textAlign="left"
  bg="white"
  color="gray.800"
  p={5}
  rounded="xl"
  shadow="xl"
  borderLeft="6px solid #7c3aed"
  outline={stageFilter === 'INVOICED' ? '3px solid #ddd6fe' : 'none'}
  onClick={() => {
    setStageFilter('INVOICED');
    setPage(1);
  }}
>
  <Flex justify="space-between" align="center" mb={2}>
    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
      Total Invoiced
    </Text>
    <Badge colorPalette="purple" px={2.5} py={0.5} rounded="full">
      {insights.collectionPct}% Collected
    </Badge>
  </Flex>

  <Text fontSize="2xl" fontWeight="extrabold" color="purple.700">
    {formatINR(insights.billed)}
  </Text>
  <Flex gap={3} wrap="wrap" fontSize="xs" color="gray.500" mt={1}>
    <Text>
      Collected: <strong style={{ color: '#059669' }}>{formatINR(insights.paid)}</strong>
    </Text>
    <Text>
      • Total Due: <strong style={{ color: '#d97706' }}>{formatINR(insights.due)}</strong>
    </Text>
  </Flex>
</Box>

{/* Card 4: Overdue Receivables vs Total Due */}
<Box
  as="button"
  textAlign="left"
  bg="white"
  color="gray.800"
  p={5}
  rounded="xl"
  shadow="xl"
  borderLeft="6px solid #dc2626"
  outline={stageFilter === 'OVERDUE' ? '3px solid #fca5a5' : 'none'}
  onClick={() => {
    setStageFilter('OVERDUE');
    setPage(1);
  }}
>
  <Flex justify="space-between" align="center" mb={2}>
    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
      Overdue Receivables
    </Text>
    <Badge colorPalette="red" px={2.5} py={0.5} rounded="full">
      {insights.overdue} Overdue Inv
    </Badge>
  </Flex>

  <Text fontSize="2xl" fontWeight="extrabold" color="red.600">
    {formatINR(insights.overdueAmount)}
  </Text>
  <Text fontSize="xs" color="gray.500" mt={1}>
    Out of <strong>{formatINR(insights.due)}</strong> total due • Click to filter
  </Text>
</Box>



            
            </SimpleGrid>
        {/* Single Unified Paginated Order-to-Payment Table */}
        <Box bg="white" color="gray.800" rounded="xl" shadow="2xl" overflow="hidden">
          <Flex
            px={5}
            py={3.5}
            bg="gray.50"
            borderBottom="1px solid"
            borderColor="gray.200"
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
          >
            <HStack gap={2} wrap="wrap">
              <Text fontSize="sm" fontWeight="bold" color="#051367">
                Order-to-Payment Lifecycle Details
              </Text>
              <Badge colorPalette="blue">{displayedRows.length} Rows</Badge>
            </HStack>

            <HStack gap={3} wrap="wrap">
              <HStack gap={1.5}>
                {(
                  [
                    { id: 'PENDING', label: 'Pending / Open' },
                    { id: 'INVOICED', label: 'Invoiced' },
                    { id: 'OVERDUE', label: 'Overdue' },
                    { id: 'ALL', label: 'All Lines' },
                  ] as { id: StageFilter; label: string }[]
                ).map((st) => (
                  <Button
                    key={st.id}
                    size="xs"
                    rounded="full"
                    variant={stageFilter === st.id ? 'solid' : 'outline'}
                    colorPalette="blue"
                    onClick={() => setStageFilter(st.id)}
                  >
                    {st.label}
                  </Button>
                ))}

                <Button
  size="xs"
  rounded="full"
  bg={statusFilter === 'OVERDUE' ? 'red.600' : 'red.50'}
  color={statusFilter === 'OVERDUE' ? 'white' : 'red.700'}
  _hover={{ bg: statusFilter === 'OVERDUE' ? 'red.700' : 'red.100' }}
  onClick={() => {
    setStatusFilter('OVERDUE');
    setPage(1);
  }}
>
  Overdue ({overdueInvoiceRows.length})

</Button>

              </HStack>

              <HStack gap={1.5}>
                <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                  Page {page} / {totalPages}
                </Text>
                <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </HStack>
            </HStack>
          </Flex>

          {loadingData ? (
            <Flex py={14} justify="center" align="center" gap={3} color="#051367">
              <Spinner size="sm" />
              <Text fontSize="sm" fontWeight="medium">Loading unified Order-to-Payment report...</Text>
            </Flex>
         ) : stageFilter === 'OVERDUE' ? (

  <>
  <Table.Root size="sm" variant="outline" interactive>
  <Table.Header bg="gray.50">
    <Table.Row>
      <Table.ColumnHeader>Customer</Table.ColumnHeader>
      <Table.ColumnHeader>SO # / Date</Table.ColumnHeader>
      <Table.ColumnHeader>Cust Ref / PO</Table.ColumnHeader>
      <Table.ColumnHeader>DC / Invoice</Table.ColumnHeader>
      <Table.ColumnHeader>Aging / Due</Table.ColumnHeader>
      <Table.ColumnHeader textAlign="end">Balance Due</Table.ColumnHeader>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {paginatedOverdueRows.length === 0 ? (
      <Table.Row>
        <Table.Cell colSpan={6} textAlign="center" py={8} color="gray.500">
          No overdue invoices found for the selected period.
        </Table.Cell>
      </Table.Row>
    ) : (
      paginatedOverdueRows.map((inv) => (
        <Table.Row key={inv.invoiceNum}>
          <Table.Cell>
            <Text fontWeight="semibold" fontSize="xs">{inv.cardName}</Text>
            <Text fontSize="2xs" color="gray.500">{inv.cardCode}</Text>
          </Table.Cell>
          <Table.Cell>
            <Text fontWeight="semibold" fontSize="xs" color="teal.700">
              {Array.from(inv.soNums).join(', ') || '-'}
            </Text>
            <Text fontSize="2xs" color="gray.500">
              {Array.from(inv.soDates).join(', ') || '-'}
            </Text>
          </Table.Cell>
          <Table.Cell fontSize="xs">
            {Array.from(inv.custRefs).join(', ') || '-'}
          </Table.Cell>
          <Table.Cell>
            <Text fontSize="xs" color="gray.600">
              DC: {Array.from(inv.dcNums).join(', ') || '-'}
            </Text>
            <Text fontSize="xs" fontWeight="bold" color="blue.700">
              Inv: {inv.invoiceNum} ({inv.invDate})
            </Text>
          </Table.Cell>
          <Table.Cell>
            <Badge colorPalette="red" variant="solid" size="xs">
              {inv.overdueDays} Days Overdue
            </Badge>
            <Text fontSize="2xs" color="gray.500" mt={0.5}>
              Due: {inv.dueDate}
            </Text>
          </Table.Cell>
          <Table.Cell textAlign="end">
            <Text fontWeight="bold" fontSize="xs" color="red.600">
              ₹{inv.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Table.Cell>
        </Table.Row>
      ))
    )}
  </Table.Body>
</Table.Root>

  </>
) : (
            <Box overflowX="auto" maxH="540px" overflowY="auto">
              <Table.Root size="sm">
                <Table.Header bg="gray.100" position="sticky" top={0} zIndex={2}>
                  <Table.Row>
                    <Table.ColumnHeader py={3} px={3} color="#051367">Customer</Table.ColumnHeader>
                    <Table.ColumnHeader color="#051367">SO # / Date</Table.ColumnHeader>
                    <Table.ColumnHeader color="#051367">Cust Ref / PO</Table.ColumnHeader>

                    <Table.ColumnHeader color="#051367">Item</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" color="#051367">Stage</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="#051367">Ord / Open</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="#051367">Open Amt</Table.ColumnHeader>
                    <Table.ColumnHeader color="#051367">PO # & Status</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" color="#051367">ETA / Status</Table.ColumnHeader>
                    <Table.ColumnHeader color="#051367">DC / Invoice #</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="#051367">Billed</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="#051367">Paid</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="#051367">Balance Due</Table.ColumnHeader>
                    <Table.ColumnHeader px={3} textAlign="center" color="#051367">Aging / Due</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" color="#051367">Approval Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Ref POs / Open Qty</Table.ColumnHeader>
<Table.ColumnHeader color="#051367">Reason</Table.ColumnHeader>
<Table.ColumnHeader color="#051367">Remarks</Table.ColumnHeader>

                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {paginatedRows.map((r, idx) => (
                    <Table.Row key={`${r.DocEntry}-${r.itemcode}-${idx}`} _hover={{ bg: 'blue.50/50' }}>
                      <Table.Cell py={2.5} px={3} maxW="180px">
                        <Text fontSize="xs" fontWeight="bold" truncate title={r.cardName}>{r.cardName}</Text>
                        <Text fontSize="11px" fontFamily="mono" color="gray.500">{r.cardCode}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="bold" color="green.700" fontSize="xs">{r.soNum}</Text>
                        <Text fontSize="11px" color="gray.500">{r.soDate}</Text>
                      </Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="xs" color="gray.700">
  {r.numAtCard || '-'}
</Table.Cell>

                      <Table.Cell maxW="210px">
                        <Text fontFamily="mono" fontSize="11px" fontWeight="bold" color="#051367">{r.itemcode}</Text>
                        <Text fontSize="xs" truncate title={r.name}>{r.name}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge colorPalette={r.lineStatus === 'Open' ? 'orange' : 'green'} variant="subtle">{r.lineStatus}</Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="end" fontSize="xs">{r.orderedQty} / <strong>{r.openQty}</strong></Table.Cell>
                      <Table.Cell textAlign="end" fontWeight="bold" fontSize="xs">{formatINR(r.openAmount)}</Table.Cell>
                      <Table.Cell>
                        <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color="purple.700">{r.poNums || '-'}</Text>
                        <Badge size="xs" colorPalette={r.poStatus === 'Open' ? 'orange' : r.poStatus === 'Closed' ? 'green' : 'gray'}>
                          {r.poStatus}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Text fontSize="xs" fontWeight="semibold">{r.U_EDA || '-'}</Text>
                        {r.U_Status && <Badge size="xs" colorPalette="purple" variant="subtle">{r.U_Status}</Badge>}
                      </Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="xs">
                        <Text color="gray.600">DC: {r.dcNums || '-'}</Text>
                        <Text fontWeight="bold" color="#051367">INV: {r.invoiceNums || '-'}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="end" fontSize="xs">{formatINR(r.billedAmount)}</Table.Cell>
                      <Table.Cell textAlign="end" fontSize="xs" fontWeight="semibold" color="green.700">{formatINR(r.paidAmount)}</Table.Cell>
                      <Table.Cell textAlign="end" fontSize="xs" fontWeight="bold" color="red.600">{formatINR(r.balanceDue)}</Table.Cell>
                   <Table.Cell px={3} textAlign="center">
  {r.overdueDays > 0 && r.balanceDue > 0 ? (
    <Box>
      <Badge colorPalette="red" variant="subtle">
        {r.overdueDays}d Overdue
      </Badge>
      {r.dueDate && (
        <Text fontSize="11px" fontWeight="semibold" color="red.600" mt={0.5}>
          Due: {r.dueDate}
        </Text>
      )}
    </Box>
  ) : r.aging !== null ? (
    <Box>
      <Badge colorPalette="blue" variant="subtle">
        {r.aging}d Open
      </Badge>
      {r.dueDate && (
        <Text fontSize="11px" color="gray.500" mt={0.5}>
          Due: {r.dueDate}
        </Text>
      )}
    </Box>
  ) : r.dueDate ? (
    <Text fontSize="11px" color="gray.600">
      Due: {r.dueDate}
    </Text>
  ) : (
    <Text fontSize="xs" color="gray.400">
      -
    </Text>
  )}
</Table.Cell>


{/* Approval Status Badge */}
<Table.Cell textAlign="center">
  <Badge
    colorPalette={
      r.approvalStatus === 'Approved'
        ? 'green'
        : r.approvalStatus === 'Disapproved'
        ? 'red'
        : r.approvalStatus === 'Hold'
        ? 'orange'
        : 'gray'
    }
    variant="subtle"
  >
    {r.approvalStatus || 'Pending'}
  </Badge>
</Table.Cell>

<Table.Cell>
  {r.itemOpenPOs && r.itemOpenPOs !== '-' ? (
    <VStack align="start" gap={0.5}>
      <Text fontSize="xs" fontWeight="semibold" color="teal.700">
        {r.itemOpenPOs}
      </Text>
      <Badge size="xs" colorPalette="teal" variant="subtle">
        Total Open: {r.itemTotalPOOpenQty}
      </Badge>
    </VStack>
  ) : (
    <Text fontSize="xs" color="gray.400">No Ref PO</Text>
  )}
</Table.Cell>


{/* Reason (U_ReasonCode) */}
<Table.Cell maxW="160px" truncate title={r.reason} fontSize="xs" fontWeight="medium">
  {r.reason || '-'}
</Table.Cell>

{/* Remarks (U_TextRm) */}
<Table.Cell maxW="200px" truncate title={r.remarks} fontSize="xs" color="gray.600">
  {r.remarks || '-'}
</Table.Cell>


                    </Table.Row>
                  ))}

                  {paginatedRows.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={13} py={12} textAlign="center" color="gray.400">
                        No records found for the selected filter criteria.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>

                {displayedRows.length > 0 && (
                  <Table.Footer bg="gray.100" fontWeight="bold">
                    <Table.Row>
                      <Table.Cell colSpan={5} px={3} color="#051367">TOTAL ({displayedRows.length} Lines)</Table.Cell>
                      <Table.Cell textAlign="end" color="#051367">{formatINR(insights.openOrder)}</Table.Cell>
                      <Table.Cell colSpan={3} />
                      <Table.Cell textAlign="end" color="#051367">{formatINR(insights.billed)}</Table.Cell>
                      <Table.Cell textAlign="end" color="green.700">{formatINR(insights.paid)}</Table.Cell>
                      <Table.Cell textAlign="end" color="red.600">{formatINR(insights.due)}</Table.Cell>
                      <Table.Cell />
                    </Table.Row>
                  </Table.Footer>
                )}
              </Table.Root>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
