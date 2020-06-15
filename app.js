////////////////////////////////////
// Budget Controler
////////////////////////////////////
var budgetController = (function() {
  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type) {
    var sum = 0;

    data.allItems[type].forEach(function(current) {
      sum += current.value;
    });
    data.total[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    total: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  };

  return {
    addItem: function(type, des, val) {
      var newItem, ID;

      // Create new ID
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // Create new item based on 'inc' or 'exp' type
      if (type === "exp") {
        newItem = new Expense(ID, des, val);
      } else if (type === "inc") {
        newItem = new Income(ID, des, val);
      }

      // Push it in to data structure
      data.allItems[type].push(newItem);

      // return new element
      return newItem;
    },
    deleteItem: function(type, id) {
      var ids, index;

      ids = data.allItems[type].map(function(current) {
        return current.id;
      });

      index = ids.indexOf(id);

      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },
    calculateBudget: function() {
      // Calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");

      // Calculate budget: income - expenses
      data.budget = data.total.inc - data.total.exp;

      // Calculate % of income spent
      if (data.total.inc > 0) {
        data.percentage = Math.round((data.total.exp / data.total.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },
    calculatePercetages: function() {
      data.allItems.exp.forEach(function(current) {
        current.calcPercentage(data.total.inc);
      });
    },
    getPercentages: function() {
      var allPercentages = data.allItems.exp.map(function(current) {
        return current.getPercentage();
      });
      return allPercentages;
    },
    getBudget: function() {
      return {
        budget: data.budget,
        totalIncome: data.total.inc,
        totalExpenses: data.total.exp,
        percentage: data.percentage
      };
    },
    test: function() {
      return data;
    }
  };
})();

////////////////////////////////////
// UI Controller
////////////////////////////////////
var UIController = (function() {
  var DOMStrings = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expensesContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expensesLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    dateLabel: ".budget__title--month"
  };

  var formatNumber = function(num, type) {
    var numSplit, int, decimal;

    //  Rules for formatting the numbers
    //  + or - before number
    //  exactly 2 decimal points
    //  comman seperating the thousands
    //  income of 2310.4567  --->  + 2,310.46
    //  expense of 2000      --->  - 2,000.00

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split(".");

    int = numSplit[0];

    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);
    }
    decimal = numSplit[1];

    return (type === "exp" ? "-" : "+") + " " + int + "." + decimal;
  };

  var nodeListForEach = function(list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value,
        // Will be either inc or exp
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      };
    },
    addListItem: function(obj, type) {
      var html, newHtml, element;
      // Create HTML string with placeholder text
      if (type === "inc") {
        element = DOMStrings.incomeContainer;
        html =
          '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === "exp") {
        element = DOMStrings.expensesContainer;
        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace placeholder text with actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },
    deleteListItem: function(selectorID) {
      var element = document.getElementById(selectorID);
      element.parentNode.removeChild(element);
    },
    clearFields: function() {
      var fields, fieldsArray;
      fields = document.querySelectorAll(
        DOMStrings.inputDescription + ", " + DOMStrings.inputValue
      );

      fieldsArray = Array.prototype.slice.call(fields);

      fieldsArray.forEach(function(current, index, array) {
        current.value = "";
      });

      fieldsArray[0].focus();
    },
    displayBudget: function(obj) {
      var type = obj.budget > 0 ? "inc" : "exp";
      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(
        obj.totalIncome,
        "inc"
      );
      document.querySelector(
        DOMStrings.expensesLabel
      ).textContent = formatNumber(obj.totalExpenses, "exp");

      if (obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "---";
      }
    },
    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

      nodeListForEach(fields, function(current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      });
    },
    displayMonth: function() {
      var now, year, month, months;

      now = new Date();

      months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "Spetember",
        "October",
        "November",
        "December"
      ];
      month = now.getMonth();
      year = now.getFullYear();
      document.querySelector(DOMStrings.dateLabel).textContent =
        months[month] + " " + year;
    },
    changedType: function() {
      var fields = document.querySelectorAll(
        DOMStrings.inputType +
          "," +
          DOMStrings.inputDescription +
          "," +
          DOMStrings.inputValue
      );

      nodeListForEach(fields, function(current) {
        current.classList.toggle("red-focus");
      });

      document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
    },
    getDOMStrings: function() {
      return DOMStrings;
    }
  };
})();

////////////////////////////////////
// Goblal app controller
////////////////////////////////////
var controller = (function(budgetCtrl, UICtrl) {
  var setUpEventListeners = function() {
    var DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function(event) {
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);

    document
      .querySelector(DOM.inputType)
      .addEventListener("change", UICtrl.changedType);
  };

  var updateBudget = function() {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Returns budget
    var budget = budgetCtrl.getBudget();
    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercetages = function() {
    // 1. Calculate percetages
    budgetCtrl.calculatePercetages();

    // 2. Read percentages from budget controles
    var percentages = budgetCtrl.getPercentages();

    // 3. Update UI with new percentages
    UICtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function() {
    var input, newItem;

    // 1. Get the field input data
    input = UICtrl.getInput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. Add item to the budget
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add item to user interface
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear the fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercetages();
    }
  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, ID;

    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemID) {
      // Format of ID: inc-1
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete item from user interface
      UICtrl.deleteListItem(itemID);

      // 3. Update and show new budget
      updateBudget();

      // 4. Calculate and update percentages
      updatePercetages();
    }
  };

  return {
    init: function() {
      console.log("Application has started");
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalIncome: 0,
        totalExpenses: 0,
        percentage: -1
      });
      setUpEventListeners();
    }
  };
})(budgetController, UIController);

controller.init();
