const statusBox=document.querySelector('#status');
const guestPanel=document.querySelector('#guest-panel');
const memberPanel=document.querySelector('#member-panel');
function showStatus(message,type=''){statusBox.textContent=message;statusBox.className=('status '+type).trim()}
const ready=typeof SUPABASE_URL==='string'&&typeof SUPABASE_PUBLISHABLE_KEY==='string'&&SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('프로젝트-ref')&&!SUPABASE_PUBLISHABLE_KEY.includes('공개키');
if(!ready){showStatus('config.js에 Supabase Project URL과 publishable key를 입력하세요.','error')}else{startApp()}
function startApp(){
 const client=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 document.querySelector('#signup').addEventListener('click',async()=>{
  const email=document.querySelector('#email').value.trim();
  const password=document.querySelector('#password').value;
  const displayName=document.querySelector('#display-name').value.trim();
  if(!email||password.length<8||displayName.length<2)return showStatus('표시 이름 2자 이상, 올바른 전자우편, 비밀번호 8자 이상을 입력하세요.','error');
  showStatus('회원가입 요청을 보내고 있습니다.');
  const{data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:location.href.split('#')[0]}});
  if(error)return showStatus('회원가입 실패: '+error.message,'error');
  showStatus(data.session?'회원가입과 로그인이 완료되었습니다.':'확인 메일의 링크를 누른 뒤 로그인하세요.','ok');
 });
 document.querySelector('#auth-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const email=document.querySelector('#email').value.trim();
  const password=document.querySelector('#password').value;
  showStatus('로그인하고 있습니다.');
  const{error}=await client.auth.signInWithPassword({email,password});
  if(error)return showStatus('전자우편, 비밀번호, 전자우편 확인 상태를 점검하세요.','error');
  showStatus('로그인되었습니다.','ok');
 });
 async function loadProfile(user){
  document.querySelector('#member-email').textContent=user.email??'';
  const{data,error}=await client.from('profiles').select('display_name, introduction').eq('user_id',user.id).maybeSingle();
  if(error)return showStatus('프로필 읽기 실패: '+error.message,'error');
  document.querySelector('#profile-name').value=data?.display_name??user.user_metadata?.display_name??'';
  document.querySelector('#introduction').value=data?.introduction??'';
 }
 function renderSession(session){const signedIn=Boolean(session?.user);guestPanel.hidden=signedIn;memberPanel.hidden=!signedIn;if(signedIn)loadProfile(session.user)}
 document.querySelector('#profile-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const{data:{user},error:userError}=await client.auth.getUser();
  if(userError||!user)return showStatus('먼저 로그인하세요.','error');
  const{error}=await client.from('profiles').upsert({user_id:user.id,display_name:document.querySelector('#profile-name').value.trim(),introduction:document.querySelector('#introduction').value.trim(),updated_at:new Date().toISOString()});
  showStatus(error?'저장 실패: '+error.message:'내 프로필을 저장했습니다.',error?'error':'ok');
 });
 document.querySelector('#logout').addEventListener('click',async()=>{const{error}=await client.auth.signOut();showStatus(error?'로그아웃 실패: '+error.message:'로그아웃되었습니다.',error?'error':'ok')});
 client.auth.onAuthStateChange((_event,session)=>renderSession(session));
 client.auth.getSession().then(({data,error})=>{if(error)return showStatus('세션 확인 실패: '+error.message,'error');renderSession(data.session);if(!data.session)showStatus('회원가입하거나 로그인하세요.')});
}
