import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { WalletIcon, Info } from "lucide-react-native";
import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { ErrorState } from "@/components/ErrorState";
import { SignInPrompt } from "@/components/SignInPrompt";
import type { Wallet } from "@/types";

export default function WalletScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    api
      .get<{ wallet: Wallet }>("/wallets/me")
      .then(({ data }) => setWallet(data.wallet))
      .catch(() => setError("Couldn't load your wallet."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWallet();
    }, [loadWallet]),
  );

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to see your wallet"
        message="Sign in to an existing account, or create a new one as a customer or a service provider."
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadWallet();
            }}
            tintColor="#FF5A3C"
          />
        }
      >
        <Text className="text-secondary text-xl font-bold mb-4">Wallet</Text>

        {loading && <ActivityIndicator color="#FF5A3C" className="mt-6" />}

        {!loading && error && (
          <ErrorState message={error} onRetry={loadWallet} />
        )}

        {!loading && !error && wallet && (
          <>
            <View className="bg-primary rounded-2xl p-6 mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <WalletIcon size={18} color="#fff" />
                <Text className="text-white/90 text-sm font-medium">
                  Available balance
                </Text>
              </View>
              <Text className="text-white text-3xl font-bold">
                {wallet.currency} {Number(wallet.balance).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-start gap-2 bg-surface border border-border rounded-2xl p-4">
              <Info size={16} color="#6B7280" style={{ marginTop: 1 }} />
              <Text className="text-muted text-xs flex-1 leading-5">
                Transaction history isn't available yet — this screen currently
                shows your live balance only. We can add a full transaction
                ledger once that's supported on the backend.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
