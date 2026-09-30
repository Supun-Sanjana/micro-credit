import { supabase } from '../lib/supabase';
async function test() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) console.error(error);
  else console.log(data.map(b => b.name));
}
test();
