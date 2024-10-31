<template>
  <div>
    <v-btn 
      v-if="!isConnected"
      @click="connectWallet" 
      variant="elevated" 
      class="mx-1" 
      :color="buttonColor"
    >
      <v-icon left class="mr-2">mdi-wallet</v-icon>
      Connect Wallet
    </v-btn>

    <v-menu v-else location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="elevated"
          class="mx-1"
          :color="buttonColor"
        >
          <v-icon left class="mr-2">mdi-wallet</v-icon>
          {{ buttonText }}
          <v-icon right class="ml-2">mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item>
          <v-list-item-title class="text-caption text-grey">
            Connected as
          </v-list-item-title>
          <v-list-item-subtitle class="font-weight-medium">
            {{ account }}
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-divider></v-divider>

        <v-list-item @click="copyAddress">
          <v-list-item-title>
            <v-icon left class="mr-2">mdi-content-copy</v-icon>
            Copy Address
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="disconnectWallet" color="error">
          <v-list-item-title class="text-error">
            <v-icon left class="mr-2">mdi-logout</v-icon>
            Disconnect
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Snackbar for copy notification -->
    <v-snackbar
      v-model="showCopyNotification"
      :timeout="2000"
      color="success"
    >
      Address copied to clipboard!
    </v-snackbar>
  </div>
</template>

<script>
import { ethers } from 'ethers'

export default {
  name: 'WalletConnector',
  
  data() {
    return {
      isConnected: false,
      account: '',
      provider: null,
      signer: null,
      showCopyNotification: false,
    }
  },

  computed: {
    buttonText() {
      return this.isConnected 
        ? `${this.account.slice(0, 6)}...${this.account.slice(-4)}`
        : 'Connect Wallet'
    },
    buttonColor() {
      return this.isConnected ? 'success' : 'primary'
    }
  },

  methods: {
    async connectWallet() {
      try {
        if (typeof window.ethereum === 'undefined') {
          alert('Please install MetaMask to use this feature')
          return
        }

        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })

        await this.establishConnection(accounts[0])

      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Error connecting wallet. Please try again.')
        this.disconnectWallet()
      }
    },

    async copyAddress() {
      try {
        await navigator.clipboard.writeText(this.account)
        this.showCopyNotification = true
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    },

    disconnectWallet() {
      this.isConnected = false
      this.account = ''
      this.provider = null
      this.signer = null
      localStorage.setItem('walletAutoConnect', 'false')
    },

    async establishConnection(account) {
      this.account = account
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      this.signer = this.provider.getSigner()
      this.isConnected = true
      localStorage.setItem('walletAutoConnect', 'true')
      this.setupListeners()
    },

    async checkConnection() {
      const shouldAutoConnect = localStorage.getItem('walletAutoConnect') === 'true'
      
      if (shouldAutoConnect && typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts'
          })
          
          if (accounts.length > 0) {
            await this.establishConnection(accounts[0])
          } else {
            // If no accounts found but autoConnect is true, try to request accounts
            try {
              const requestedAccounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
              })
              if (requestedAccounts.length > 0) {
                await this.establishConnection(requestedAccounts[0])
              }
            } catch (error) {
              console.error('Auto-connect failed:', error)
              this.disconnectWallet()
            }
          }
        } catch (error) {
          console.error('Error checking connection:', error)
          this.disconnectWallet()
        }
      }
    },

    setupListeners() {
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            this.disconnectWallet()
          } else {
            this.account = accounts[0]
          }
        })

        window.ethereum.on('chainChanged', () => {
          const shouldAutoConnect = this.isConnected
          localStorage.setItem('walletAutoConnect', shouldAutoConnect.toString())
          window.location.reload()
        })

        window.ethereum.on('disconnect', () => {
          this.disconnectWallet()
        })
      }
    },
  },

  async mounted() {
    await this.checkConnection()
  },

  beforeUnmount() {
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
      window.ethereum.removeAllListeners('disconnect')
    }
  }
}
</script>

<style scoped>
.v-list-item {
  min-height: 40px;
}
</style> 