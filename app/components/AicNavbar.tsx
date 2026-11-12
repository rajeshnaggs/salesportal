'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Box, Text, Image, Button, HStack, Badge } from '@chakra-ui/react';
import { LogOut } from 'lucide-react';

interface AicNavbarProps {
  userName?: string;
}

export default function AicNavbar({ userName = 'Admin' }: AicNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGOUT' }),
    });
    router.push('/login');
  };

  return (
    <Flex
      as="header"
      bg="#051367"
      color="white"
      px={{ base: 4, md: 8 }}
      py={3}
      align="center"
      justify="space-between"
      borderBottom="3px solid #0a2499"
      shadow="md"
      position="sticky"
      top={0}
      zIndex={30}
    >
      <HStack gap={3}>
        <Box bg="white" p={0.5} rounded="full" shadow="sm">
          <Image src="/aic-logo.png" alt="AIC Logo" boxSize="40px" rounded="full" objectFit="contain" />
        </Box>
        <Box>
          <Text fontWeight="bold" fontSize="sm" letterSpacing="wider">
            AIC SALES PORTAL
          </Text>
          <Text fontSize="11px" color="blue.200">
            SAP Customer 360° & Order Traceability
          </Text>
        </Box>
      </HStack>

      <HStack gap={4}>
        <Badge colorPalette="green" variant="subtle" px={2.5} py={1} rounded="full" fontSize="11px">
          ● SAP Live
        </Badge>
        <Text fontSize="xs" color="blue.100" display={{ base: 'none', sm: 'block' }}>
          Welcome, <strong>{userName}</strong>
        </Text>
        <Button
          size="xs"
          bg="red.600"
          color="white"
          _hover={{ bg: 'red.500' }}
          onClick={handleLogout}
          gap={1.5}
        >
          <LogOut size={14} />
          Logout
        </Button>
      </HStack>
    </Flex>
  );
}
