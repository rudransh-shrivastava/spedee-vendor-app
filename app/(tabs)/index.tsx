import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  Button,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { WordPress } from "../../lib/WordPress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginForm from "@/components/LoginForm";

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  interface BillingInfo {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }

  interface Order {
    id: number;
    billing: BillingInfo;
    status: string;
    total: string;
  }

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    updateOrders(); // Fetch orders immediately
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

  const openModal = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

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
          <TouchableOpacity key={order.id} onPress={() => openModal(order)}>
            <View style={styles.orderRow}>
              <Text
                style={styles.columnCustomerName}
              >{`${order.billing.first_name} ${order.billing.last_name}`}</Text>
              <Text
                style={styles.columnAddress}
              >{`${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}, ${order.billing.postcode}, ${order.billing.country}`}</Text>
              <Text style={styles.columnStatus}>{order.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedOrder && (
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.modalLabel}>Customer Name:</Text>
              <Text
                style={styles.modalValue}
              >{`${selectedOrder.billing.first_name} ${selectedOrder.billing.last_name}`}</Text>
              <Text style={styles.modalLabel}>Address:</Text>
              <Text
                style={styles.modalValue}
              >{`${selectedOrder.billing.address_1}, ${selectedOrder.billing.city}, ${selectedOrder.billing.state}, ${selectedOrder.billing.postcode}, ${selectedOrder.billing.country}`}</Text>
              <Text style={styles.modalLabel}>Order Status:</Text>
              <Text style={styles.modalValue}>{selectedOrder.status}</Text>

              <Text style={styles.modalLabel}>Items:</Text>
              {selectedOrder.line_items.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Name: </Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Quantity: </Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Total: </Text>
                      <Text style={styles.itemTotal}>{item.total}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <Text style={styles.modalLabel}>Order Total:</Text>
              <Text style={styles.modalValue}>{selectedOrder.total}</Text>
              <Button title="Close" onPress={closeModal} />
            </View>
          </View>
        </Modal>
      )}
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemLabel: {
    fontWeight: "bold",
  },
  itemName: {
    flex: 1,
    textAlign: "left",
  },
  itemQuantity: {
    flex: 1,
    textAlign: "left",
  },
  itemTotal: {
    flex: 1,
    textAlign: "left",
  },
});
