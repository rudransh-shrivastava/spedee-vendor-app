import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import WordPress from './Wordpress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundFetch from 'react-native-background-fetch';
import BackgroundTimer from 'react-native-background-timer';

import LoginForm from './components/LoginForm';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Button,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {OrderStatus} from './Wordpress';
import LocalNotification from './Notification';

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
  line_items: any;
  id: number;
  billing: BillingInfo;
  status: string;
  total: string;
}

function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState<{[key: number]: OrderStatus}>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );

  useEffect(() => {
    const checkCredentials = async () => {
      const email = await AsyncStorage.getItem('vendorEmail');
      const password = await AsyncStorage.getItem('vendorPassword');
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
      console.log('loading orders');
      const storedOrders = await AsyncStorage.getItem('orders');
      if (storedOrders?.length) {
        console.log('stored orders length: ', storedOrders.length);
        setOrders(JSON.parse(storedOrders));
      }
    };
    const updateOrders = async () => {
      const email = await AsyncStorage.getItem('vendorEmail');
      const password = await AsyncStorage.getItem('vendorPassword');
      if (email && password) {
        const newOrders = await fetchOrders(email, password);
        if (newOrders && newOrders.length > 0) {
          if (orders.length === 0) {
            // Initial load, just set the orders without notification
            setOrders(newOrders);
          } else if (newOrders.length > orders.length) {
            // showNotification('New Order', 'You have a new order!');
            console.log('new ORDER YOo', newOrders.length, orders.length);
            setOrders(newOrders);
          }
          await AsyncStorage.setItem('orders', JSON.stringify(newOrders));
        }
        setOrders(newOrders);
        await AsyncStorage.setItem('orders', JSON.stringify(newOrders));
      }
    };

    const intervalId = setInterval(updateOrders, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId);
  }, [orders]);

  const fetchOrders = async (email: any, password: any) => {
    try {
      const wpConfig = {
        url: 'https://spedee.com',
        username: email,
        password: password,
      };
      const wp = new WordPress(wpConfig);
      const fetchedOrders = await wp.getOrders();
      console.log('fetched orders');
      return fetchedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const email = AsyncStorage.getItem('vendorEmail');
      const password = AsyncStorage.getItem('vendorPassword');
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Fetch orders when the app comes to the foreground
        fetchOrders(email, password);
      } else if (nextAppState.match(/inactive|background/)) {
        // Start background timer when the app goes to the background
        console.log('App has gone to the background!');
        BackgroundTimer.runBackgroundTimer(() => {
          console.log('background timer runs');
          fetchOrders(email, password);
        }, 60000); // Fetch orders every 60 seconds
      } else if (nextAppState === 'active') {
        // Stop background timer when the app comes to the foreground
        BackgroundTimer.stopBackgroundTimer();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
      BackgroundTimer.stopBackgroundTimer();
    };
  }, [appState]);

  useEffect(() => {
    const configureBackgroundFetch = async () => {
      BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // Fetch interval in minutes
          stopOnTerminate: false,
          startOnBoot: true,
        },
        async taskId => {
          console.log('[BackgroundFetch] taskId:', taskId);
          const email = await AsyncStorage.getItem('vendorEmail');
          const password = await AsyncStorage.getItem('vendorPassword');
          await fetchOrders(email, password);
          BackgroundFetch.finish(taskId);
        },
        error => {
          console.error('[BackgroundFetch] failed to start:', error);
        },
      );

      BackgroundFetch.status(status => {
        switch (status) {
          case BackgroundFetch.STATUS_RESTRICTED:
            console.log('BackgroundFetch restricted');
            break;
          case BackgroundFetch.STATUS_DENIED:
            console.log('BackgroundFetch denied');
            break;
          case BackgroundFetch.STATUS_AVAILABLE:
            console.log('BackgroundFetch is enabled');
            break;
        }
      });
    };

    if (isLoggedIn) {
      configureBackgroundFetch();
    }
  }, [isLoggedIn]);

  const handleStatusChange = async () => {
    console.log('handle Status change');
    const email = await AsyncStorage.getItem('vendorEmail');
    const password = await AsyncStorage.getItem('vendorPassword');
    if (email && password) {
      console.log(selectedOrder?.id, newStatus);
      if (selectedOrder && newStatus) {
        try {
          const wpConfig = {
            url: 'https://spedee.com',
            username: email,
            password: password,
          };
          const wp = new WordPress(wpConfig);
          await wp.updateOrderStatus(selectedOrder.id, newStatus);
          closeModal();
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      }
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(orderStatus[order.id] || order.status);
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
        <Button
          title="LogOut"
          onPress={() => {
            LocalNotification('Hi', 'Hello');
          }}
        />
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
                style={
                  styles.columnCustomerName
                }>{`${order.billing.first_name} ${order.billing.last_name}`}</Text>
              <Text
                style={
                  styles.columnAddress
                }>{`${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}, ${order.billing.postcode}, ${order.billing.country}`}</Text>
              <Text style={styles.columnStatus}>{order.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedOrder && (
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.modalLabel}>Customer Name:</Text>
              <Text
                style={
                  styles.modalValue
                }>{`${selectedOrder.billing.first_name} ${selectedOrder.billing.last_name}`}</Text>
              <Text style={styles.modalLabel}>Address:</Text>
              <Text
                style={
                  styles.modalValue
                }>{`${selectedOrder.billing.address_1}, ${selectedOrder.billing.city}, ${selectedOrder.billing.state}, ${selectedOrder.billing.postcode}, ${selectedOrder.billing.country}`}</Text>

              <Text style={styles.modalLabel}>Status:</Text>
              <Text style={styles.modalValue}>{selectedOrder.status}</Text>
              <View style={styles.statusRow}>
                <Text>Change Status:</Text>
                <Picker
                  selectedValue={newStatus}
                  style={styles.picker}
                  onValueChange={itemValue =>
                    setNewStatus(itemValue as OrderStatus)
                  }>
                  <Picker.Item
                    label="Pending Payment"
                    value={OrderStatus.PendingPayment}
                  />
                  <Picker.Item
                    label="Processing"
                    value={OrderStatus.Processing}
                  />
                  <Picker.Item label="On Hold" value={OrderStatus.OnHold} />
                  <Picker.Item
                    label="Completed"
                    value={OrderStatus.Completed}
                  />
                  <Picker.Item
                    label="Cancelled"
                    value={OrderStatus.Cancelled}
                  />
                  <Picker.Item label="Failed" value={OrderStatus.Failed} />
                  <Picker.Item label="Draft" value={OrderStatus.Draft} />
                </Picker>
              </View>
              <TouchableOpacity
                onPress={() => {
                  console.log('pressed status change button');
                  handleStatusChange();
                }}
                style={styles.button}>
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>
              <Text style={styles.modalLabel}>Items:</Text>
              {selectedOrder.line_items.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image source={{uri: item.image}} style={styles.itemImage} />
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
  picker: {
    flex: 1,
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  stepContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 10,
  },
  columnCustomerName: {
    width: 80,
    textAlign: 'center',
  },
  columnAddress: {
    width: 160,
    textAlign: 'center',
  },
  columnStatus: {
    width: 70,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    padding: 20,
    backgroundColor: 'black',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLabel: {
    fontWeight: 'bold',
  },
  itemName: {
    flex: 1,
    textAlign: 'left',
  },
  itemQuantity: {
    flex: 1,
    textAlign: 'left',
  },
  itemTotal: {
    flex: 1,
    textAlign: 'left',
  },
});
export default App;
