'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Image,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function AicLoginPage() {
  const router = useRouter();
  const [uname, setUname] = useState('');
  const [auth, setAuth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', uname, auth }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid username or password.');
        setLoading(false);
        return;
      }

      router.push('/dashboard/customer');
    } catch {
      setError('Unable to reach server. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="to-br"
      gradientFrom="#02072b"
      gradientVia="#051367"
      gradientTo="#0a2499"
      px={4}
    >
      <Container maxW="md">
        <Box
          bg="white"
          rounded="2xl"
          shadow="2xl"
          p={{ base: 7, sm: 10 }}
          borderTop="6px solid #051367"
        >
          {/* AIC Logo Header */}
          <Stack align="center" gap={3} mb={7}>
            <Box p={1.5} rounded="full" border="2px solid #051367" bg="white" shadow="md">
              <Image
                src="/aiclogo.png"
                alt="AIC Logo"
                boxSize="86px"
                objectFit="contain"
                rounded="full"
              />
            </Box>

            <Box textAlign="center">
              <Heading size="md" color="#051367" letterSpacing="wide">
                AIC SALES PORTAL
              </Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Sign in to access Customer 360° & SAP Order Tracking
              </Text>
            </Box>
          </Stack>

          {/* Error Alert */}
          {error && (
            <Flex
              align="center"
              gap={2}
              bg="red.50"
              color="red.700"
              border="1px solid"
              borderColor="red.200"
              px={3.5}
              py={2.5}
              rounded="lg"
              mb={5}
              fontSize="xs"
              fontWeight="medium"
            >
              <AlertCircle size={16} />
              <Text>{error}</Text>
            </Flex>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <Stack gap={4}>
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="#051367" textTransform="uppercase" mb={1.5}>
                  Username
                </Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" zIndex={2}>
                    <User size={17} />
                  </Box>
                  <Input
                    required
                    type="text"
                    value={uname}
                    onChange={(e) => setUname(e.target.value)}
                    placeholder="Enter your username"
                    pl={10}
                    bg="gray.50"
                    color="gray.900"
                    borderColor="gray.300"
                    _focus={{ borderColor: '#051367', bg: 'white' }}
                  />
                </Box>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="bold" color="#051367" textTransform="uppercase" mb={1.5}>
                  Password
                </Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" zIndex={2}>
                    <Lock size={17} />
                  </Box>
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={auth}
                    onChange={(e) => setAuth(e.target.value)}
                    placeholder="Enter your password"
                    pl={10}
                    pr={10}
                    bg="gray.50"
                    color="gray.900"
                    borderColor="gray.300"
                    _focus={{ borderColor: '#051367', bg: 'white' }}
                  />
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                    aria-label="Toggle Password"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </Box>
              </Box>

              <Button
                type="submit"
                mt={2}
                size="lg"
                bg="#051367"
                color="white"
                _hover={{ bg: '#0a2499' }}
                _active={{ bg: '#030c47' }}
                loading={loading}
                loadingText="Verifying..."
                fontSize="sm"
                fontWeight="bold"
                letterSpacing="wide"
                shadow="md"
                gap={2}
              >
                SIGN IN
                <ArrowRight size={17} />
              </Button>
            </Stack>
          </form>

          <Text fontSize="xs" color="gray.400" textAlign="center" mt={7}>
            © 2026 AIC • Powered by APS
          </Text>
        </Box>
      </Container>
    </Flex>
  );
}
