document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.querySelector(".dropdown");
    const dropbtn = document.querySelector(".dropbtn");
    const dropdownContent = document.querySelector(".dropdown-content");

    if (dropbtn && dropdownContent && dropdown) {
        // Функция для переключения меню
        function toggleDropdown(event) {
            event.stopPropagation(); // Остановка всплытия события
            dropdownContent.classList.toggle("show");
        }

        // Функция для закрытия меню при клике вне его
        function closeDropdown(event) {
            if (!dropdown.contains(event.target)) {
                dropdownContent.classList.remove("show");
            }
        }

        // Обработчик клика по кнопке
        dropbtn.addEventListener("click", toggleDropdown);

        // Обработчик клика вне меню
        document.addEventListener("click", closeDropdown);

        // Закрываем меню при выборе языка
        dropdownContent.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", function () {
                dropdownContent.classList.remove("show");
            });
        });
    }
});

const translations = {
    en: {
        greeting: "Hi, how are you?",
        support: "Support us:",
        donate: "Donate with PayPal",
        contact: "Contacts:",
        contacts: "Gmail: Toploardgg@gmail.com & Telegram: Loardstk",
        name: "Toploardgg (Stas)",
        language: "English"
    },
    ru: {
        greeting: "Привет, как дела?",
        support: "Поддержать нас:",
        donate: "Пожертвовать через PayPal",
        contact: "Контакты:",
        contacts: "Gmail: Toploardgg@gmail.com & Telegram: Loardstk",
        name: "Toploardgg (Стас)",
        language: "Русский"
    },
    uk: {
        greeting: "Привіт, як справи?",
        support: "Підтримайте нас:",
        donate: "Пожертвувати через PayPal",
        contact: "Контакти:",
        contacts: "Gmail: Toploardgg@gmail.com & Telegram: Loardstk",
        name: "Toploardgg (Стас)",
        language: "Українська"
    }
};

function changeLanguage(lang) {
    document.getElementById("greeting").textContent = translations[lang].greeting;
    document.getElementById("support").textContent = translations[lang].support;
    document.getElementById("donate").textContent = translations[lang].donate;
    document.getElementById("name").textContent = translations[lang].name;
    document.getElementById("contacts").textContent = translations[lang].contacts;
    document.getElementById("contact").textContent = translations[lang].contact;
    document.getElementById("language-button").textContent = translations[lang].language;
}
