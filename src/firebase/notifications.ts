// TODO Razmisliti da li treba slika da se dodaje u notifikacije

export interface Notification {
  title: string;
  body: string;
  image: string;
}

export const notifications = {
  CALL_WAITER: {
    title: "Waiter!👋",
    body: "Table `tableName` is calling you!",
    image: "https://cdni.iconscout.com/illustration/premium/thumb/woman-calling-waiter-at-restaurant-10426069-8472481.png",
  },
  WAITER_COMING: {
    title: "Waiter coming!🏃‍♂️",
    body: "",
    image: "https://cdni.iconscout.com/illustration/premium/thumb/woman-calling-waiter-at-restaurant-10426069-8472481.png",
  },
  PAY: {
    title: "Payment!💸",
    body: "Table `tableName` is ready to pay with `paymentType`!",
    image: "https://cdni.iconscout.com/illustration",
  },
  MESSAGE: {
    title: "Message from table `tableName`!📩",
    body: "`message`",
    image: "https://cdni.iconscout.com/illustration/premium/thumb/woman-calling-waiter-at-restaurant-10426069-8472481.png",
  },
  NEW_ORDER: {
    title: "New order from table `tableName`!🍔",
    body: "",
    image: "https://cdni.iconscout.com/illustration/premium/thumb/woman-calling-waiter-at-restaurant-10426069-8472481.png",
  },
  ORDER_APPROVAL: {
    title: "Orders resolved!🍔",
    body: "",
    image: "https://cdni.iconscout.com/illustration/premium/thumb/woman-calling-waiter-at-restaurant-10426069-8472481.png",
  },
};
