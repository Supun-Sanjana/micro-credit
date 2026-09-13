const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const target = '<span className="tracking-tight">Data migration support</span>\n                    </div>\n                  </div>\n                  <div className="mt-10 pt-8 border-t border-white/10">\n                    <p className="text-white/50 text-xs font-medium tracking-wide uppercase mb-3">Or email us directly</p>\n                    <a href="mailto:solida@cylvox.com" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors">\n                      <div className="h-8 w-8 rounded-full bg-brand-violet/20 flex items-center justify-center text-brand-violet">\n                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>\n                      </div>\n                      <span className="font-medium tracking-tight">solida@cylvox.com</span>\n                    </a>\n                  </div>\n                </div>';

content = content.replace(/<span className="tracking-tight">Data migration support<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/, target);
fs.writeFileSync('app/page.tsx', content, 'utf8');
