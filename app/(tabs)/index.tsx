import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  Button,
  ScrollView,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useEffect, useState } from "react";
import { WordPress } from "../../lib/WordPress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginForm from "@/components/LoginForm";

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});

  useEffect(() => {
    const checkCredentials = async () => {
      const email = await AsyncStorage.getItem("vendorEmail");
      const password = await AsyncStorage.getItem("vendorPassword");
      if (email && password) {
        setIsLoggedIn(true);
        fetchOrders(email, password);
      }
    };
    checkCredentials();
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
    setOrders(fetchedOrders);
    // const initialStatus = {};
    // fetchedOrders.forEach((order: any) => {
    //   initialStatus[order.id]  = order.status;
    // });
    // setOrderStatus(initialStatus);
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
          <View key={order.id} style={styles.orderRow}>
            <Text
              style={styles.columnCustomerName}
            >{`${order.billing.first_name} ${order.billing.last_name}`}</Text>
            <Text
              style={styles.columnAddress}
            >{`${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}, ${order.billing.postcode}, ${order.billing.country}`}</Text>
            <Text style={styles.columnStatus}>{order.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
