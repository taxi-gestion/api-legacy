import p from"fastify";import y from"@fastify/postgres";var i=({process:t,server:e})=>{let r=f({server:e,process:t});t.once("SIGINT",r),t.once("SIGTERM",r)},f=({process:t,server:e})=>async r=>{console.log(`*^!@4=> Received signal to terminate: ${r}`),await e.close(),t.kill(t.pid,r)},c=async({server:t,process:e})=>{let r=parseInt(e.env.PORT??""),a="0.0.0.0";try{await t.listen({port:r,host:a},(n,o)=>{n&&(console.error(n),e.exit(1)),console.log(`Server listening at ${o}`)}),console.log(`*^!@4=> Process id: ${e.pid}`)}catch(n){t.log.error(n),e.exit(1)}};var l=t=>async()=>{let e=await t.connect();try{let[r,a,n,o]=await Promise.all([e.query(b),e.query(m),e.query(u),e.query(g)]);return{databaseSize:r.rows[0],numberOfConnexions:a.rows[0],numberOfActiveConnexions:n.rows[0],listOfAllPublicTables:JSON.stringify(o.rows)}}catch(r){return new Error(r.message)}finally{e.release()}},b=`
    SELECT pg_size_pretty(pg_database_size(current_database()));
    `,m=`
    SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database();
    `,u=`
    SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active';
    `,g=`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
    `;var s=p();i({server:s,process});s.register(y,{connectionString:process.env.DATABASE_URL??""});s.get("/",async(t,e)=>`OK
`);s.get("/health",async(t,e)=>`OK
`);s.get("/database-status",async(t,e)=>{let r=await l(s.pg)();e.send(r)});c({server:s,process});
