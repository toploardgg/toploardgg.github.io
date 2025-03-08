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
