// แทรกส่วนหัว/ท้ายเว็บแบบเดียวกับ https://www.ben2.ac.th/ ให้ทุกหน้า
(function () {
    var LOGO = 'https://www.ben2.ac.th/wordpress/wp-content/uploads/2026/07/cropped-cropped-Gemini_Generated_Image_sceysnsceysnscey-Photoroom-2-150x150.png';
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    function link(href, icon, text) {
        var active = href === page ? ' active' : '';
        return '<a href="' + href + '" class="' + active + '"><i class="fas ' + icon + '"></i> ' + text + '</a>';
    }

    var header =
        '<div class="topbar"><div class="wrap">' +
            '<span>ระบบแจ้งซ่อมอุปกรณ์สื่อออนไลน์</span>' +
            '<a href="https://www.ben2.ac.th/" target="_blank" rel="noopener"><i class="fas fa-school"></i> เว็บไซต์โรงเรียน</a>' +
        '</div></div>' +
        '<div class="site-head">' +
            '<div class="wrap brand-row">' +
                '<a class="brand" href="index.html">' +
                    '<img src="' + LOGO + '" alt="ตราโรงเรียน" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
                    '<span class="brand-icon"><i class="fas fa-school"></i></span>' +
                    '<span><div class="brand-name">โรงเรียนเบญจมราชรังสฤษฎิ์ ๒</div>' +
                    '<div class="brand-sub">Benchamarachrungsarit 2 School · ระบบแจ้งซ่อม BEN2 Maintenance</div></span>' +
                '</a>' +
            '</div>' +
            '<nav class="main-nav"><div class="wrap">' +
                link('index.html', 'fa-house', 'หน้าแรก') +
                '<a href="index.html#repair"><i class="fas fa-screwdriver-wrench"></i> แจ้งซ่อม</a>' +
                link('dashboard.html', 'fa-clipboard-list', 'ติดตามสถานะ') +
                link('admin.html', 'fa-user-shield', 'ผู้ดูแลระบบ') +
                '<a class="ext" href="https://www.ben2.ac.th/" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i> ben2.ac.th</a>' +
            '</div></nav>' +
        '</div>' +
        '<div class="ticker"><div class="wrap">' +
            '<span class="ticker-pill"><i class="fas fa-bullhorn"></i> แจ้งซ่อม</span>' +
            '<span class="ticker-text">แจ้งปัญหาโปรเจคเตอร์ คอมพิวเตอร์ โทรทัศน์ และอุปกรณ์สื่ออื่น ๆ ได้ที่นี่ ฝ่ายช่างจะรับเรื่องและอัปเดตสถานะให้ทราบ</span>' +
        '</div></div>';

    var footer =
        '<footer class="site-foot">' +
            '<div class="foot-grid">' +
                '<div><h4>โรงเรียนเบญจมราชรังสฤษฎิ์ ๒</h4>' +
                    '<div>ระบบแจ้งซ่อมอุปกรณ์สื่อออนไลน์ แจ้งรวดเร็ว ติดตามง่าย สบายใจช่าง</div></div>' +
                '<div><h4>เมนู</h4>' +
                    '<a href="index.html">หน้าแรก</a><a href="index.html#repair">แจ้งซ่อม</a><a href="dashboard.html">ติดตามสถานะ</a></div>' +
                '<div><h4>ลิงก์</h4>' +
                    '<a href="https://www.ben2.ac.th/" target="_blank" rel="noopener">เว็บไซต์โรงเรียน</a><a href="admin.html">ผู้ดูแลระบบ</a></div>' +
            '</div>' +
            '<div class="foot-bottom">© 2026 BEN2 Maintenance System<br>' +
                '<span class="dev"><i class="fas fa-laptop-code"></i> พัฒนาระบบโดย: นายวีระภัทร อ่วมเกษม</span> · ' +
                'นักศึกษาเทคโนโลยีคอมพิวเตอร์ KMITL ชั้นปีที่ 2</div>' +
        '</footer>';

    var h = document.getElementById('site-header');
    var f = document.getElementById('site-footer');
    if (h) h.innerHTML = header;
    if (f) f.outerHTML = footer;
})();
