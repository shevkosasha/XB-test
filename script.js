// сохраняем необходимые элементы верстки в переменные
const currencySelector = document.getElementById('currency-select');
const currencyList = document.getElementById('currency-list');
const calendarElem = document.getElementById('calendar-input');
const amountElem = document.getElementById('amount');

const today = new Date(); // получаем сегоднящнюю дату
let diff = 0; // разность выбранной даты с today, по умолчанию равна 0

//массив валют и объект с эталонными значениями
const currencies = ['USD','BYN','EUR','CNY','RUB'];
const USDrate = {
    CNY: 6.338,
    BYN: 2.574,
    EUR: 0.881,
    RUB: 75.988,
    USD: 1
}

const pastUSDrates = []; // объект для хранения сгенерироанных курсов за прошлые 14 дней
let currentCurrency; // переменная для выбранной валюты

// функция обновляет список валют в лейблах
const populateCurrencyList = (currency) => {
    currencyList.innerHTML = '';

    const arr  = currencies.filter( item => item !== currency);

    const p = document.createElement("p");
    p.className = 'description';  
    p.innerHTML = `Сумма <span class="amount_value">${amountElem.value}</span> ${currency} эквивалентна:`;  
    currencyList.append(p);

    arr.forEach(item => {
        let elem = document.createElement("label");
        elem.className = `amount__label ${item}`;
        currencyList.append(elem);
    })
}

// функция конвертации 
const calcAmounts = (val) => {

    // считаем курс выбранной валюты относительно какой-то базовой валюты, например, USD в заданный день, день определяется по diff
    const rate = pastUSDrates[diff][currentCurrency] / pastUSDrates[diff].USD;

    // в newRates поместим относительный курс  
    const newRates = {};

    // в amounts сохраним конвертированные значения
    const amounts = {};
    
    // получаем курсы всех валют и корректируем с учетом rate
    const entries = Object.entries(pastUSDrates[diff]);    
    entries.forEach(item => {
        newRates[item[0]] = (item[0] != currentCurrency) ? item[1] / rate : 1;
        amounts[item[0]] = val * newRates[item[0]];
    })

    // возвращаем объект с конвертированными значениями
    return amounts;
}


// функция для вывода сконвертированных значений
const printAmounts = (obj) => {
    const amountSpan = document.querySelector('.amount_value');
    amountSpan.textContent = amountElem.value;
    
    const entries = Object.entries(obj);
    entries.forEach(item => {
        const elem = document.querySelector(`.${item[0]}`);
        if (elem) {
            elem.textContent = `${item[1].toFixed(3)} ${item[0]}`;
        }
    })
}

const addZero = (num) => (num >= 10) ? num : '0' + num;

const diffDate = (date1,date2) => Math.floor((date1 - date2) / (1000 * 60 * 60 * 24)); // получаем разность дат

// const addDays = (days) => {
//     const date = new Date();
//     date.setDate(today.getDate() + days);
   
//     return date;
// }

Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

const randomPercent = (max) => 1 + (Math.floor(Math.random() * max + 1)) / 100;





//первичная отрисовка селектора, 
(() => {
    currencies.forEach(item => {
        let elem = document.createElement("option");
        elem.value = elem.textContent =  item;
        currencySelector.append(elem);
    })
    currentCurrency = currencySelector.value;
    amountElem.value = amountElem.textContent =  USDrate[currentCurrency];
    calendarElem.value = `${today.getFullYear()}-${addZero(today.getMonth()+1)}-${addZero(today.getDate())}`;

    populateCurrencyList(currentCurrency);

    
    
    

    pastUSDrates[0] = Object.assign(USDrate);    

    for ( let i = 1; i < 15; i++) {
        pastUSDrates[i] = {
            CNY: (USDrate.CNY * randomPercent(10)),
            BYN: (USDrate.BYN * randomPercent(10)),
            EUR: (USDrate.EUR * randomPercent(10)),
            RUB: (USDrate.RUB * randomPercent(10)),
            USD: 1        
        }    
    }

    printAmounts(calcAmounts(amountElem.value));
    console.log(today.addDays(60));
})();

currencySelector.addEventListener('change', (e) => {
    e.preventDefault(); 
    currentCurrency = e.target.value;
    populateCurrencyList(currentCurrency);
    printAmounts(calcAmounts(amountElem.value));
});

amountElem.addEventListener('input',(e) => {
    e.preventDefault();
    // cx
    amountElem.value = Math.abs(amountElem.value);
    printAmounts(calcAmounts(amountElem.value));
})

calendarElem.addEventListener('change',(e) => {
    e.preventDefault();
    
    const date = new Date(e.target.value);
    diff = diffDate(today, date);

    if (diff < 0) {
        diff = 0;
        alert('Мы не можем курс из будущего, т.к. мы их не знаем. Вместо этого покажем курс на сегодня');
        calendarElem.value = `${today.getFullYear()}-${addZero(today.getMonth()+1)}-${addZero(today.getDate())}`;
    } else {
        if (diff > 14) {
            diff = 14;
            const lastDay = today.addDays(diff);
            const dateStr = `${addZero(lastDay.getDate())}.${addZero(lastDay.getMonth())}.${lastDay.getFullYear()}`;
            calendarElem.value = `${lastDay.getFullYear()}-${addZero(lastDay.getMonth())}-${addZero(lastDay.getDate())}`;
            alert(`Мы не храним историю курсов валют больше, чем 14 дней, к сожалению.\nСейчас покажем курсы на последнюю доступную дату: ${dateStr}`);
            
        }        
    }
    printAmounts(calcAmounts(amountElem.value));
})


