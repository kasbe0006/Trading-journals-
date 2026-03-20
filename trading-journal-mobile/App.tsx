import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "./src/lib/api";
import { API_BASE_URL } from "./src/lib/config";
import { clearToken, getToken, saveToken } from "./src/lib/storage";
import type { CreateTradePayload, Trade, User } from "./src/lib/types";

function toFixedNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entry, setEntry] = useState("1.1000");
  const [exitPrice, setExitPrice] = useState("1.1020");
  const [stopLoss, setStopLoss] = useState("1.0980");
  const [takeProfit, setTakeProfit] = useState("1.1040");
  const [lotSize, setLotSize] = useState("1");
  const [strategyTag, setStrategyTag] = useState("mobile");
  const [notes, setNotes] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const isLoggedIn = useMemo(() => Boolean(token && user), [token, user]);

  const loadTrades = async (authToken: string) => {
    const data = await api.listTrades(authToken);
    setTrades(data);
  };

  const bootstrap = async () => {
    try {
      setLoading(true);
      setError(null);
      const saved = await getToken();
      if (!saved) {
        setLoading(false);
        return;
      }

      const profile = await api.me(saved);
      setToken(saved);
      setUser(profile);
      await loadTrades(saved);
    } catch (bootstrapError) {
      await clearToken();
      setToken(null);
      setUser(null);
      const message = bootstrapError instanceof Error ? bootstrapError.message : "Failed to restore session";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const handleLogin = async () => {
    try {
      setLoginBusy(true);
      setError(null);
      const response = await api.login(identifier.trim(), password);
      await saveToken(response.token);
      setToken(response.token);
      setUser({ id: response.id, email: response.email, name: response.name });
      await loadTrades(response.token);
      setPassword("");
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Login failed";
      setError(message);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
    setTrades([]);
  };

  const handleCreateTrade = async () => {
    if (!token) return;

    const payload: CreateTradePayload = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      entry: toFixedNumber(entry),
      exitPrice: toFixedNumber(exitPrice),
      stopLoss: toFixedNumber(stopLoss),
      takeProfit: toFixedNumber(takeProfit),
      lotSize: toFixedNumber(lotSize, 1),
      strategyTag: strategyTag.trim(),
      notes: notes.trim(),
    };

    try {
      setCreateBusy(true);
      setError(null);
      await api.createTrade(token, payload);
      await loadTrades(token);
      setNotes("");
      Alert.alert("Saved", "Trade added and synced with website data.");
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create trade";
      setError(message);
    } finally {
      setCreateBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.infoText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trading Journal Mobile</Text>
        <Text style={styles.subtitle}>Connected to: {API_BASE_URL}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoggedIn ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Email or username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              style={styles.input}
            />
            <Pressable onPress={handleLogin} style={styles.primaryButton} disabled={loginBusy}>
              <Text style={styles.primaryButtonText}>{loginBusy ? "Signing in..." : "Sign in"}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.cardTitle}>Welcome {user?.name}</Text>
                  <Text style={styles.smallText}>{user?.email}</Text>
                </View>
                <Pressable onPress={handleLogout} style={styles.ghostButton}>
                  <Text style={styles.ghostButtonText}>Logout</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Add trade</Text>
              <TextInput value={symbol} onChangeText={setSymbol} style={styles.input} placeholderTextColor="#94a3b8" placeholder="Symbol" />
              <View style={styles.row}>
                <Pressable onPress={() => setDirection("LONG")} style={[styles.toggle, direction === "LONG" && styles.toggleActive]}>
                  <Text style={styles.toggleText}>LONG</Text>
                </Pressable>
                <Pressable onPress={() => setDirection("SHORT")} style={[styles.toggle, direction === "SHORT" && styles.toggleActive]}>
                  <Text style={styles.toggleText}>SHORT</Text>
                </Pressable>
              </View>
              <TextInput value={entry} onChangeText={setEntry} style={styles.input} keyboardType="numeric" placeholder="Entry" placeholderTextColor="#94a3b8" />
              <TextInput value={exitPrice} onChangeText={setExitPrice} style={styles.input} keyboardType="numeric" placeholder="Exit" placeholderTextColor="#94a3b8" />
              <TextInput value={stopLoss} onChangeText={setStopLoss} style={styles.input} keyboardType="numeric" placeholder="Stop loss" placeholderTextColor="#94a3b8" />
              <TextInput value={takeProfit} onChangeText={setTakeProfit} style={styles.input} keyboardType="numeric" placeholder="Take profit" placeholderTextColor="#94a3b8" />
              <TextInput value={lotSize} onChangeText={setLotSize} style={styles.input} keyboardType="numeric" placeholder="Lot size" placeholderTextColor="#94a3b8" />
              <TextInput value={strategyTag} onChangeText={setStrategyTag} style={styles.input} placeholder="Strategy tag" placeholderTextColor="#94a3b8" />
              <TextInput value={notes} onChangeText={setNotes} style={styles.input} placeholder="Notes" placeholderTextColor="#94a3b8" />

              <Pressable onPress={handleCreateTrade} style={styles.primaryButton} disabled={createBusy}>
                <Text style={styles.primaryButtonText}>{createBusy ? "Saving..." : "Save trade"}</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent trades ({trades.length})</Text>
              {trades.length === 0 ? (
                <Text style={styles.smallText}>No trades yet.</Text>
              ) : (
                trades.slice(0, 12).map((trade) => {
                  const id = trade._id ?? trade.id ?? Math.random().toString();
                  return (
                    <View key={id} style={styles.tradeRow}>
                      <View>
                        <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                        <Text style={styles.smallText}>{trade.direction}</Text>
                      </View>
                      <View style={styles.tradeRight}>
                        <Text style={[styles.tradePnl, (trade.pnl ?? 0) >= 0 ? styles.green : styles.red]}>
                          {(trade.pnl ?? 0).toFixed(2)}
                        </Text>
                        <Text style={styles.smallText}>R: {(trade.rrRatio ?? 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
    gap: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  ghostButton: {
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: "#cbd5e1",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggle: {
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 9,
  },
  toggleActive: {
    backgroundColor: "#1e40af",
    borderColor: "#60a5fa",
  },
  toggleText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  smallText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  errorText: {
    color: "#fca5a5",
    backgroundColor: "#7f1d1d",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  infoText: {
    color: "#cbd5e1",
  },
  tradeRow: {
    borderTopColor: "#1f2937",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tradeSymbol: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600",
  },
  tradeRight: {
    alignItems: "flex-end",
  },
  tradePnl: {
    fontSize: 14,
    fontWeight: "700",
  },
  green: {
    color: "#22c55e",
  },
  red: {
    color: "#ef4444",
  },
});
