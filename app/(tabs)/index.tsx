import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { WordPress } from "../../lib/WordPress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginForm from "@/components/LoginForm";

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCredentials = async () => {
      const email = await AsyncStorage.getItem("vendorEmail");
      const password = await AsyncStorage.getItem("vendorPassword");
      if (email && password) {
        setIsLoggedIn(true);
        await fetchOrders(email, password);
      }
      setIsLoading(false);
    };
    checkCredentials();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      const storedOrders = await AsyncStorage.getItem("orders");
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    };

    const updateOrders = async () => {
      const email = await AsyncStorage.getItem("vendorEmail");
      const password = await AsyncStorage.getItem("vendorPassword");
      if (email && password) {
        const newOrders = await fetchOrders(email, password);
        setOrders(newOrders);
        await AsyncStorage.setItem("orders", JSON.stringify(newOrders));
      }
    };

    loadOrders();

    const intervalId = setInterval(updateOrders, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const fetchOrders = async (email: any, password: any) => {
    const wpConfig = {
      url: "https://spedee.com",
      username: email,
      password: password,
    };
    const wp = new WordPress(wpConfig);
    const fetchedOrders = await wp.getOrders();
    console.log(fetchedOrders);
    return fetchedOrders;
  };

  const handleStatusChange = (orderId: any, status: any) => {
    setOrderStatus((prevStatus) => ({
      ...prevStatus,
      [orderId]: status,
    }));
  };
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleSave = async (orderId: any) => {};

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ScrollView>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Order Management</Text>
      </View>
      <View style={styles.stepContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.columnCustomerName]}>
            Customer Name
          </Text>
          <Text style={[styles.tableHeaderText, styles.columnAddress]}>
            Address
          </Text>
          <Text style={[styles.tableHeaderText, styles.columnStatus]}>
            Status
          </Text>
        </View>
        {orders.map((order: any) => (
          <Link href="/order" asChild key={order.id}>
            <Pressable>
              <View style={styles.orderRow}>
                <Text
                  style={styles.columnCustomerName}
                >{`${order.billing.first_name} ${order.billing.last_name}`}</Text>
                <Text
                  style={styles.columnAddress}
                >{`${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}, ${order.billing.postcode}, ${order.billing.country}`}</Text>
                <Text style={styles.columnStatus}>{order.status}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    margin: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  stepContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  columnCustomerName: {
    width: 120,
    textAlign: "center",
  },
  columnAddress: {
    width: 200,
    textAlign: "center",
  },
  columnStatus: {
    width: 100,
    textAlign: "center",
  },
});
