const fs = require('fs');
const file = 'app/app/(dashboard)/dashboard/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const correctTail = `      </div>
    </div>
  )
}

function StatCard({ title, value, delta }: { title: string, value: string, delta: React.ReactNode }) {
  return (
    <div className="bg-paper-white rounded-[20px] p-6 shadow-subtle-3 flex flex-col gap-2">
      <span className="text-[15px] font-medium text-slate-gray tracking-wide">{title}</span>
      <span className="text-[32px] font-sans font-medium text-ink-black tracking-[-0.5px] truncate">{value}</span>
      <span className="text-[13px] font-medium text-[#137333] mt-2 flex items-center">{delta}</span>
    </div>
  )
}`;

let newLines = lines.slice(0, 165); // up to line 164 which is `      </div>` before `    </div>`
newLines.push(correctTail);
fs.writeFileSync(file, newLines.join('\n'));
console.log('done');
