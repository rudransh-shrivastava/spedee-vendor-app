import { Image, StyleSheet, Platform, View, Text, Button } from "react-native";

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
    <View>
      <View style={styles.title}>
        <Text>Order Management</Text>
      </View>
      <View style={styles.stepContainer}>
        {orders.map((order: any) => (
          <View key={order.id} style={styles.orderRow}>
            <Text>Order ID: {order.id}</Text>

            <Button title="Save" onPress={() => handleSave(order.id)} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
  },
  titleContainer: {
    // flexDirection: "row",
    // alignItems: "center",
    // gap: 8,
  },
  stepContainer: {
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
