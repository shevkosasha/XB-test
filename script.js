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

//вспомогательня функция для добавления незначащих нулей в двузначные числа
const addZero = (num) => (num >= 10) ? num : '0' + num;

// вспом. функция для случайного процента
const randomPercent = (max) => 1 + (Math.floor(Math.random() * max + 1)) / 100;

// вспом.функция для вычисления разности дат в днях
const diffDate = (date1,date2) => Math.floor((date1 - date2) / (1000 * 60 * 60 * 24)); // получаем разность дат

// вспом. функция изменения даты, добавляет заданное количество дней к дате
Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};


//первичная отрисовка селектора, 
(() => {
    //отрисовываем селектор с валютами
    currencies.forEach(item => {
        let elem = document.createElement("option");
        elem.value = elem.textContent =  item;
        currencySelector.append(elem);
    })
    // сохраняем в currentCurrency значение селектора
    currentCurrency = currencySelector.value;

    // по умолчанию количество валюты равно 1
    amountElem.value = amountElem.textContent = 1;

    // прописываем в datepicker текущую дату
    calendarElem.value = `${today.getFullYear()}-${addZero(today.getMonth()+1)}-${addZero(today.getDate())}`;

    // исключаем из лейблов выбранную в селекторе валюту
    populateCurrencyList(currentCurrency);    

    // в массив объектов с историей валют за 14 дней нулевым значением прописываем эталонные курсы из объекта USDrate
    pastUSDrates[0] = Object.assign(USDrate);    

    // заполняем pastUSDrates случайными значениями курсов
    for ( let i = 1; i < 15; i++) {
        pastUSDrates[i] = {
            CNY: (USDrate.CNY * randomPercent(10)),
            BYN: (USDrate.BYN * randomPercent(10)),
            EUR: (USDrate.EUR * randomPercent(10)),
            RUB: (USDrate.RUB * randomPercent(10)),
            USD: 1        
        }    
    }

    // показываем текущие курсы
    printAmounts(calcAmounts(amountElem.value));
})();

currencySelector.addEventListener('change', (e) => {
    e.preventDefault(); 
    // после выбора другой валюты перерисовываем список валют в лейблах и пересчитываем значения
    currentCurrency = e.target.value;
    populateCurrencyList(currentCurrency);
    printAmounts(calcAmounts(amountElem.value));
});

amountElem.addEventListener('input',(e) => {
    e.preventDefault();
    // после изменения количества валюты конвертируем полученное значение, значения из поля берем по модулю
    amountElem.value = Math.abs(amountElem.value);
    printAmounts(calcAmounts(amountElem.value));
})

calendarElem.addEventListener('change',(e) => {
    e.preventDefault();
    // после изменения даты высчитываем разность между выбранной датой и текущей
    const date = new Date(e.target.value);
    diff = diffDate(today, date);

    // если разность меньше нуля, т.е. выбрана дата из будущего, то предупреждаем пользователя, что курс из будущего показать нельзя
    // и в календарь записываем текущую дату
    if (diff < 0) {
        diff = 0;
        alert('Мы не можем показать курсы валют из будущего, т.к. мы их не знаем. Вместо этого покажем курсы на сегодня');
        calendarElem.value = `${today.getFullYear()}-${addZero(today.getMonth()+1)}-${addZero(today.getDate())}`;
    } else {
        // если разность больше 14, т.е. выбранный день был раньше на 15 дней и более, то также предупреждаем, 
        // что показать курс на эту дату невозможно и показываем курс на крайнюю возможную дату.
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


