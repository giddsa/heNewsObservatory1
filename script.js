/**
 * المرصد الإخباري - ملف JavaScript الرئيسي
 * يتضمن وظائف لجلب البيانات وعرض الأخبار وإدارة واجهة المستخدم
 */

// انتظار تحميل DOM بالكامل
document.addEventListener("DOMContentLoaded", function() {
    // تنفيذ قائمة همبرغر
    document.querySelector('.hamburger-menu').addEventListener('click', function() {
        document.querySelector('nav').classList.toggle('active');
    });
    
    // تهيئة الصفحة
    initPage();
});

/**
 * تهيئة الصفحة وتحميل البيانات
 */
function initPage() {
    // عرض رسالة التحميل
    const newsContainer = document.getElementById("news");
    const loadingMessage = document.querySelector(".loading-message");
    
    // جلب بيانات الأخبار
    getNewsData()
        .then(newsData => {
            // إخفاء رسالة التحميل
            if (loadingMessage) {
                loadingMessage.style.display = 'none';
            }
            
            // عرض الأخبار
            if (newsContainer) {
                renderNews(newsData);
            }
        })
        .catch(error => {
            console.error("خطأ في تحميل الأخبار:", error);
            
            // عرض رسالة خطأ
            if (newsContainer) {
                newsContainer.innerHTML = `<p class="error-message">⚠️ خطأ في تحميل الأخبار: ${error.message}</p>`;
            }
        });
}

/**
 * جلب بيانات الأخبار مع التخزين المؤقت
 * @returns {Promise} وعد يحتوي على بيانات الأخبار
 */
function getNewsData() {
    // التحقق من وجود البيانات في التخزين المؤقت
    const cachedData = localStorage.getItem('newsData');
    if (cachedData && (JSON.parse(cachedData).timestamp > Date.now() - 3600000)) {
        // استخدام البيانات المخزنة إذا كانت حديثة (أقل من ساعة)
        return Promise.resolve(JSON.parse(cachedData).data);
    } else {
        // جلب بيانات جديدة
        return fetch("news.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error("فشل في جلب البيانات");
                }
                return response.json();
            })
            .then(data => {
                // تخزين البيانات مع طابع زمني
                localStorage.setItem('newsData', JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                }));
                return data;
            });
    }
}

/**
 * عرض الأخبار في الصفحة
 * @param {Array} newsData مصفوفة تحتوي على بيانات الأخبار
 */
function renderNews(newsData) {
    const newsContainer = document.getElementById("news");
    
    // استخدام DocumentFragment لتحسين الأداء
    const fragment = document.createDocumentFragment();
    
    // إنشاء بطاقات الأخبار
    newsData.forEach(news => {
        const newsCard = createNewsCard(news);
        fragment.appendChild(newsCard);
    });
    
    // إضافة جميع البطاقات دفعة واحدة
    newsContainer.appendChild(fragment);
    
    // تنفيذ تحميل الصور بشكل كسول
    setupLazyLoading();
}

/**
 * إنشاء بطاقة خبر
 * @param {Object} news بيانات الخبر
 * @returns {HTMLElement} عنصر بطاقة الخبر
 */
function createNewsCard(news) {
    // التحقق من صحة البيانات
    if (!validateNewsData(news)) {
        console.error("بيانات خبر غير صالحة:", news);
        return document.createElement("div"); // إرجاع عنصر فارغ
    }
    
    // إنشاء بطاقة الخبر
    const newsCard = document.createElement("div");
    newsCard.classList.add("news-card");
    
    // إنشاء رابط للخبر
    const newsLink = document.createElement("a");
    newsLink.href = `index2.html?id=${news.id}`;
    newsLink.classList.add("news-link");
    
    // إنشاء صورة الخبر
    const newsImage = document.createElement("img");
    newsImage.dataset.src = news.image; // استخدام data-src للتحميل الكسول
    newsImage.src = "images/placeholder.jpg"; // صورة مؤقتة
    newsImage.alt = `صورة توضيحية: ${news.title}`;
    newsLink.appendChild(newsImage);
    
    // إنشاء عنوان الخبر
    const newsTitle = document.createElement("h3");
    newsTitle.textContent = news.title;
    newsLink.appendChild(newsTitle);
    
    // إنشاء تاريخ الخبر
    const newsDate = document.createElement("p");
    newsDate.textContent = `تاريخ الخبر: ${news.date}`;
    newsDate.classList.add("news-date");
    newsLink.appendChild(newsDate);
    
    // إنشاء ملخص الخبر
    const newsSummary = document.createElement("p");
    newsSummary.textContent = truncateText(news.content, 100);
    newsLink.appendChild(newsSummary);
    
    // إضافة الرابط إلى البطاقة
    newsCard.appendChild(newsLink);
    
    return newsCard;
}

/**
 * التحقق من صحة بيانات الخبر
 * @param {Object} news بيانات الخبر
 * @returns {boolean} صحة البيانات
 */
function validateNewsData(news) {
    return news && 
           typeof news.id !== 'undefined' && 
           news.title && 
           news.content && 
           news.date;
}

/**
 * اقتطاع النص إلى طول محدد
 * @param {string} text النص المراد اقتطاعه
 * @param {number} maxLength الطول الأقصى
 * @returns {string} النص المقتطع
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * إعداد تحميل الصور بشكل كسول
 */
function setupLazyLoading() {
    // التحقق من دعم Intersection Observer
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => {
                        img.removeAttribute('data-src');
                    };
                    observer.unobserve(img);
                }
            });
        });
        
        // تطبيق المراقب على جميع الصور
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // بديل للمتصفحات التي لا تدعم Intersection Observer
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

/**
 * إضافة بيانات هيكلية للصفحة
 */
function addStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        "name": "المرصد الإخباري",
        "url": "https://example.com",
        "logo": {
            "@type": "ImageObject",
            "url": "https://example.com/logo.png"
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// إضافة البيانات الهيكلية عند تحميل الصفحة
addStructuredData();
