import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

// Development adapter for the exact D1 interface used by the hosted Worker.
// The same SQL migrations and room handler run locally, with no second protocol.
export function createSQLiteStore(filename=':memory:',{beforeMigration}={}){
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
 const sql=new DatabaseSync(filename);sql.exec('PRAGMA foreign_keys=ON');
 sql.exec('CREATE TABLE IF NOT EXISTS local_migrations (filename TEXT PRIMARY KEY)');
 const migrations=new URL('../drizzle/',import.meta.url);
 for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort()){
  if(sql.prepare('SELECT 1 FROM local_migrations WHERE filename=?').get(file))continue;
  sql.exec('BEGIN');try{beforeMigration?.(sql,file);sql.exec(readFileSync(new URL(file,migrations),'utf8'));sql.prepare('INSERT INTO local_migrations VALUES(?)').run(file);sql.exec('COMMIT');}catch(error){sql.exec('ROLLBACK');sql.close();throw error;}
 }
 class Prepared{
  constructor(query,args=[]){this.query=query;this.args=args;}
  bind(...args){return new Prepared(this.query,args);}
  result(){const results=sql.prepare(this.query).all(...this.args);return {success:true,results,meta:{changes:sql.prepare('SELECT changes() AS changes').get().changes}};}
  async run(){return this.result();}
  async first(){return this.result().results[0]??null;}
 }
 const db={prepare:query=>new Prepared(query),async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>s.result());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}},withSession(){return this;}};
 return {db,sql,close:()=>sql.close()};
}
