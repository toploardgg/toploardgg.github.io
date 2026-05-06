document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyBtn');
    const codeBlock = document.getElementById('codeBlock');

    if (copyBtn && codeBlock) {
        copyBtn.addEventListener('click', async () => {
            try {
                const textToCopy = codeBlock.textContent;
                
                await navigator.clipboard.writeText(textToCopy);

                copyBtn.classList.remove('fa-copy');
                copyBtn.classList.add('fa-check');
                copyBtn.style.color = '#4CAF50';
                setTimeout(() => {
                    copyBtn.classList.remove('fa-check');
                    copyBtn.classList.add('fa-copy');
                    copyBtn.style.color = '';
                }, 2000);

            } catch (err) {
                console.error('Ошибка при копировании: ', err);
                alert('Не удалось скопировать текст');
            }
        });
    }
});