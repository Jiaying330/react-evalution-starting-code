const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (cartItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartItem),
    })
      .then((res) => {
        return res.json();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const updateCart = (id, newAmount, content) => {
    // define your method to update an item in cart
    const inventoryItem = {
      id: id,
      content: content,
      count: newAmount,
      // Add other fields if necessary
    };

    return fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryList = document.querySelector(".inventory-list");
  const cartList = document.querySelector(".cart-list");
  const checkoutBtn = document.querySelector(".checkout-btn");

  const getAmount = (id) => {
    const amount = document.querySelector(`.inventory-item-amount-count-${id}`);
    return amount.innerHTML;
  };

  const getItemName = (id) => {
    const name = document.querySelector(`.inventory-item-name-${id}`);
    return name.innerHTML;
  };

  const renderCart = (cartItems) => {
    cartList.innerHTML = "";
    for (const item of cartItems) {
      const newItemEl = document.createElement("li");
      const spanEl = document.createElement("span");
      const deleteBtn = document.createElement("button");

      spanEl.innerHTML = `${item.content} x ${item.count}`;
      deleteBtn.innerHTML = "Delete";
      deleteBtn.classList.add("cart-item-delete-btn");

      newItemEl.appendChild(spanEl);
      newItemEl.appendChild(deleteBtn);
      newItemEl.id = `${item.id}`;
      newItemEl.classList.add("cart-item");
      cartList.appendChild(newItemEl);
    }
  };

  const renderInventory = (inventoryItems) => {
    inventoryList.innerHTML = "";
    for (const item of inventoryItems) {
      const newItemEl = document.createElement("li");
      const spanEl = document.createElement("span");
      const addBtn = document.createElement("button");
      const minusBtn = document.createElement("button");
      const plusBtn = document.createElement("button");
      const amount = document.createElement("span");

      const amountEl = document.createElement("div");
      amountEl.classList.add("inventory-item-amount");
      minusBtn.innerHTML = "-";
      plusBtn.innerHTML = "+";
      amount.innerHTML = "0";
      minusBtn.classList.add("inventory-item-minus-btn");
      plusBtn.classList.add("inventory-item-plus-btn");
      amount.classList.add(`inventory-item-amount-count-${item.id}`);
      amountEl.appendChild(minusBtn);
      amountEl.appendChild(amount);
      amountEl.appendChild(plusBtn);

      spanEl.innerHTML = `${item.content}`;
      spanEl.classList.add(`inventory-item-name-${item.id}`);
      addBtn.innerHTML = "Add to Cart";
      addBtn.classList.add("inventory-item-add-btn");
      newItemEl.id = `${item.id}`;

      newItemEl.appendChild(spanEl);
      newItemEl.appendChild(amountEl);
      newItemEl.appendChild(addBtn);
      newItemEl.classList.add("inventory-item");
      inventoryList.appendChild(newItemEl);
    }
  };

  const updateAmount = (id, amount) => {
    const element = document.querySelector(
      `.inventory-item-amount-count-${id}`
    );
    element.innerHTML = amount;
  };

  return {
    inventoryList,
    cartList,
    renderCart,
    renderInventory,
    getAmount,
    getItemName,
    updateAmount,
    checkoutBtn,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    state.subscribe(() => {
      view.renderCart(state.cart);
    });
    model.getCart().then((data) => {
      state.cart = data;
    });
    model.getInventory().then((data) => {
      state.inventory = data;
      view.renderInventory(state.inventory);
    });
  };
  const handleUpdateAmount = () => {
    view.inventoryList.addEventListener("click", (event) => {
      const element = event.target;
      if (element.classList[0] == "inventory-item-plus-btn") {
        const id = element.parentElement.parentElement.id;
        const count = parseInt(view.getAmount(id));
        view.updateAmount(id, count + 1);
      } else if (element.classList[0] == "inventory-item-minus-btn") {
        const id = element.parentElement.parentElement.id;
        const count = parseInt(view.getAmount(id));
        if (count > 0) {
          view.updateAmount(id, count - 1);
        }
      }
    });
  };

  const handleAddToCart = () => {
    view.inventoryList.addEventListener("click", (event) => {
      const element = event.target;
      if (element.classList[0] == "inventory-item-add-btn") {
        const id = element.parentElement.id;
        const name = view.getItemName(id);
        let count = parseInt(view.getAmount(id));

        let flag = false;
        for (const item of state.cart) {
          if (item.id == id) {
            flag = true;
            count += item.count;
            break;
          }
        }
        const newItem = {
          id: id,
          content: name,
          count: count,
        };

        if (flag && count != 0) {
          model.updateCart(id, count, name).then((res) => {
            state.cart = state.cart.map((item) =>
              item.id === id ? res : item
            );
          });
        } else if (count != 0) {
          model.addToCart(newItem).then((res) => {
            state.cart = [...state.cart, res];
          });
        }
      }
    });
  };

  const handleDelete = () => {
    view.cartList.addEventListener("click", (event) => {
      const element = event.target;
      if (element.classList[0] == "cart-item-delete-btn") {
        const id = element.parentElement.id;
        model.deleteFromCart(id).then(() => {
          state.cart = state.cart.filter((cart) => cart.id != id);
        });
      }
    });
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener("click", () => {
      for (let item of state.cart) {
        model.deleteFromCart(item.id);
      }
      state.cart = [];
    });
  };
  const bootstrap = () => {
    handleAddToCart();
    handleDelete();
    handleCheckout();
    handleUpdateAmount();
  };
  return {
    bootstrap,
    init,
  };
})(Model, View);

Controller.init();

Controller.bootstrap();
