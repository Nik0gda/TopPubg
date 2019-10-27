const axios = require('axios'),
      moment = require('moment'),
      i18   = require('../helpers/i18next.js');

class Pubg {
  constructor(pool, vars) {
    this.pool = pool;
    this.vars = vars;
  }

  registration(nickname) {
    return new Promise((resolve, reject) => {
      this.getID(nickname).then(pubgID => resolve(pubgID)).catch(e => {
        axios.get(`https://api.pubg.com/shards/steam/players?filter[playerNames]=${nickname}`, {
          headers: {
            'Authorization': this.vars.apiKey,
            'Accept': 'application/vnd.api+json'
          },
        }).then(({ data }) => {
          try {
            const { id, attributes: { name } } = data.data[0];
            resolve(id);
            const queryData = [{ name, id }, { name, id }];
            this.pool.query('INSERT INTO `pubg` SET ? ON DUPLICATE KEY UPDATE ?', queryData);
          } catch (e) {
            reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
            console.error(`no pubgID for ${nickname}: ${e.message}`);
          }
        }).catch(error => {
          if (error.response.status === 404) {
            reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
          } else {
            const temp = error.response ? error.response.status : 'null';
            reject(i18.t([`${this.vars.lng}:error.http.${temp}`, `error.http.${temp}`, 'error.http.null']));
            console.error(`getPubgId Error: ${error.response.status} = ${error.response.statusText}`);
          }
        });
      });
    });
  }

  getID(nickname, accountID) {
    return new Promise((resolve, reject) => {
      if (!nickname) return reject(i18.t([`${this.vars.lng}:error.wrongnick`, 'error.wrongnick']));
      new Promise((done) => {
        if (accountID) {
          done(accountID);
        } else {
          this.pool.query('SELECT id from pubg WHERE ?', { name: nickname }).then(([results]) => {
            done(results[0] && results[0].id);
          });
        }
      })
      .then(pubgID => {
        if (!pubgID) {
          reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
        } else if (pubgID) {
          resolve(pubgID.trim());
        }
      });
    });
  }

  getIDopgg(nickname) {
    return new Promise((resolve, reject) => {
      if (!nickname) return reject(i18.t([`${this.vars.lng}:error.wrongnick`, 'error.wrongnick']));
      this.pool.query('SELECT opgg from pubg WHERE ?', { name: nickname }).then(([results]) => {
        return results[0] && results[0].id;
      }).then(pubgID => {
        if (pubgID) {
          resolve(pubgID);
        } else {
          axios.get(`https://pubg.op.gg/user/${nickname}`).then(({ data }) => {
            const api = data.match(/data-user_id="(\w{20,30})"/);
            if (api) {
              this.pool.query('UPDATE pubg SET ?', { opgg: api[1] });
              resolve(api[1]);
            } else {
              reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
            }
          }).catch((error) => {
            if (error.response.status === 404) {
              reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
            } else {
              const temp = error.response ? error.response.status : 'null';
              reject(i18.t([`${this.vars.lng}:error.http.${temp}`, `error.http.${temp}`, 'error.http.null']));
              console.error(`getIDopgg Error: ${error.response.status} = ${error.response.statusText}`);
            }
          });
        }
      }).catch(console.error);
    });
  }

  getAll(nickname, accountID) {
    return new Promise((resolve, reject) => {
      this.getID(nickname, accountID).then((pubgID) => {
        axios.get(`https://api.pubg.com/shards/steam/players/${pubgID}/seasons/${this.vars.season}`, {
          headers: {
            'Authorization': this.vars.apiKey,
            'Accept': 'application/vnd.api+json'
          },
        }).then((response) => {
          let data = {}, stats = [];
          try {
            data = response.data.data.attributes.gameModeStats;
          } catch (e) {
            console.error(`getAll Error: gameModeStats`);
          }
          for (let mode in data) {
            const x = data[mode];
            if (x.roundsPlayed) {
              const kd = Math.round(100*x.kills/(x.losses||1))/100;
              const tierList = {
                0: 'Unranked',
                1: "Beginner V",
                200: "Beginner IV",
                400: "Beginner III",
                600: "Beginner II",
                800: "Beginner I",
                1000: "Novice V",
                1200: "Novice IV",
                1400: "Novice III",
                1600: "Novice II",
                1800: "Novice I",
                2000: "Experienced V",
                2200: "Experienced IV",
                2400: "Experienced III",
                2600: "Experienced II",
                2800: "Experienced I",
                3000: "Skilled V",
                3200: "Skilled IV",
                3400: "Skilled III",
                3600: "Skilled II",
                3800: "Skilled I",
                4000: "Specialist V",
                4200: "Specialist IV",
                4400: "Specialist III",
                4600: "Specialist II",
                4800: "Specialist I",
                5000: "Expert",
                6000: "Survivor",
              };
              const imageList = {
                Unranked: 'https://res.cloudinary.com/k1ker/image/upload/v1543090085/pubgRanks/unranked.png',
                "Beginner V": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/bronze.png',
                "Beginner IV": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/bronze.png',
                "Beginner III": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/bronze.png',
                "Beginner II": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/bronze.png',
                "Beginner I": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/bronze.png',
                "Novice V": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/silver.png',
                "Novice IV": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/silver.png',
                "Novice III": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/silver.png',
                "Novice II": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/silver.png',
                "Novice I": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/silver.png',
                "Experienced V": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/gold.png',
                "Experienced IV": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/gold.png',
                "Experienced III": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/gold.png',
                "Experienced II": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/gold.png',
                "Experienced I": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/gold.png',
                "Skilled V": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/platinum.png',
                "Skilled IV": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/platinum.png',
                "Skilled III": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/platinum.png',
                "Skilled II": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/platinum.png',
                "Skilled I": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/platinum.png',
                "Specialist V": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/diamond.png',
                "Specialist IV": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/diamond.png',
                "Specialist III": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/diamond.png',
                "Specialist II": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/diamond.png',
                "Specialist I": 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/diamond.png',
                Expert: 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/elite.png',
                Survivor: 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/master.png',
                Grandmaster: 'https://res.cloudinary.com/k1ker/image/upload/v1543089770/pubgRanks/grandmaster.png',
              };
              let image, tier, rating = Math.round(x.rankPoints);
              for (let key in tierList) {
                if (rating >= key) {
                  tier = tierList[key];
                  image = imageList[tier];
                } else {
                  break;
                }
              }
              const obj = {
                nickname,
                mode,
                rating,
                rank: null,
                kd,
                adr: Math.round(x.damageDealt/x.roundsPlayed),
                win_rate: Math.round(10000*x.wins/x.roundsPlayed)/100,
                top10_rate: Math.round(10000*x.top10s/x.roundsPlayed)/100,
                matches: x.roundsPlayed,
                headshots: Math.round(10000*x.headshotKills/(x.kills||1))/100,
                rank_avg: null,
                kills: x.kills,
                wins: x.wins,
                top10: x.top10s,
                image,
                tier,
              };
              stats.push(obj);
            }
          }
          return resolve(stats);
        }).catch((error) => {
          console.error(error);
          if (error.response.status === 404) {
            reject(i18.t([`${this.vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
            this.pool.query('INSERT INTO `opgg` SET ? ON DUPLICATE KEY UPDATE ?', [{ nickname, pubg: 0 }, {pubg: 0}]);
          } else {
            const temp = error.response ? error.response.status : 'null';
            reject(i18.t([`${this.vars.lng}:error.http.${temp}`, `error.http.${temp}`, 'error.http.null']));
            console.error(`getAll Error: ${error.response.status} = ${error.response.statusText}`);
          }
        })
      }).catch((e) => {
        reject(e);
      });
    });
  }

  getPlace(nickname, accountID) {
    return new Promise((resolve, reject) => {
      this.getAll(nickname, accountID).then((results) => {
        let queries = [], maxArray = [], tpp = [], fpp = [], 
          tppKD = [], fppKD = [], tppAVG = [], fppAVG = [];
        let role, roleFpp, kd, kdFpp, avg, avgFpp;
        if (results.length > 0) {
          results.forEach(x => {
            queries.push([`s${+this.vars.SEASON.slice(-2)}`, {
              server: this.vars.uniq, mode: x.mode.replace('-',''), name: x.nickname, rating: x.rating, kd: x.kd, rank: x.rank, adr: x.adr, winrate: x.win_rate, top10rate: x.top10_rate, matches: x.matches, wins: x.wins,
            }, {
              rating: x.rating, kd: x.kd, rank: x.rank, adr: x.adr, winrate: x.win_rate, top10rate: x.top10_rate, matches: x.matches, wins: x.wins,
            }]);
            if (!x.mode.includes("solo")) {
              maxArray.push({
                rating: x.rating,
                mode: capitalize(x.mode),
                kd: x.kd,
                adr: x.adr,
                adr50: Math.round(x.adr/50)*50,
                winrate: x.win_rate,
                matches: x.matches,
                tier: x.tier,
              });
              if (x.mode.includes("fpp")) {
                fpp.push(x.rating);
                if (x.matches >= 10) {
                  fppKD.push(x.kd);
                  fppAVG.push(Math.round(x.adr/50)*50);
                }
              } else {
                tpp.push(x.rating);
                if (x.matches >= 10) {
                  tppKD.push(x.kd);
                  tppAVG.push(Math.round(x.adr/50)*50);
                }
              }
            }
          })
          this.pool.getConnection().then((conn) => {
            queries.forEach((item) => {
              conn.query(`INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE server = ${this.vars.uniq}|server, ?`, [item[0], item[1], item[2]])
                .catch(error => console.error('INSERT ODKU mySQL mistake:', error));
            });
            conn.release();
          });
          if (tpp.length > 0) role = Math.max.apply(null, tpp);
          if (fpp.length > 0) roleFpp = Math.max.apply(null, fpp);
          if (tppKD.length > 0) kd = Math.max.apply(null, tppKD);
          if (fppKD.length > 0) kdFpp = Math.max.apply(null, fppKD);
          if (tppAVG.length > 0) avg = Math.max.apply(null, tppAVG);
          if (fppAVG.length > 0) avgFpp = Math.max.apply(null, fppAVG);
          maxArray.sort((a, b) => b.matches - a.matches);
          resolve({
            rankTpp: role,
            rankFpp: roleFpp,
            kdTpp: kd,
            kdFpp,
            adrTpp: avg,
            adrFpp: avgFpp,
            info: maxArray[0],
          });
        } else {
          resolve(i18.t([`${this.vars.lng}:error.nodata`, 'error.nodata'], { nickname }));
        }
      }).catch(e => reject(e));
    });
  }

  getAllStats(nickname, accountID) {
    return new Promise((resolve, reject) => {
      this.getAll(nickname, accountID).then((results) => {
        let allStats = [], myArray = [];
	      results.forEach((item) => {
	        myArray.push([`s${+this.vars.SEASON.slice(-2)}`, {
            server: this.vars.uniq, mode: item.mode.replace('-',''), name: item.nickname, rating: item.rating, kd: item.kd, rank: item.rank, adr: item.adr, winrate: item.win_rate, top10rate: item.top10_rate, matches: item.matches, wins: item.wins,
          }, {
            rating: item.rating, kd: item.kd, rank: item.rank, adr: item.adr, winrate: item.win_rate, top10rate: item.top10_rate, matches: item.matches, wins: item.wins,
          }]);
	        allStats.push({
	        	name: `:black_small_square:${capitalize(item.mode)}`,
            value: `**Rating:** ${item.rating}\n**K/D:** ${item.kd}\n**Avg. Dmg:** ${item.adr}\n**Matches:** ${item.matches}`,
            inline: true,
	        });
	      });
	      if (myArray.length > 0) {
          this.pool.getConnection().then((conn) => {
            myArray.forEach((item) => {
              conn.query(`INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE server = ${this.vars.uniq}|server, ?`, [item[0], item[1], item[2]])
                .catch(error => console.error('INSERT ODKU mySQL mistake:', error));
            });
            conn.release();
          });
	      } else {
          return resolve(i18.t([`${this.vars.lng}:error.nodata`, 'error.nodata'], { nickname }));
        }
	      resolve({
          embed: {
            color: 0x49bd1c,
            fields: allStats,
            footer: {
              icon_url: this.vars.img.footer,
              text: this.vars.footer,
            },
            timestamp: new Date(),
            title: `:bar_chart: stats for ${nickname}:`,
          },
        });
      }).catch((e) => {
        reject(e);
      });
    });
  }

  getStats(nickname, mode = 'squad-fpp') {
    mode = mode.toLowerCase();
    return new Promise((resolve, reject) => {
      this.getAll(nickname).then((results) => {
        results = results.filter(x => x.mode == mode);
        if (results.length > 0) {
          let x = results[0];
          let ico = 'https://i.imgur.com/JNFvst9.png';
          if (mode.includes('duo')) ico = 'https://i.imgur.com/v4iElgM.png';
          else if (mode.includes('squad')) ico = 'https://i.imgur.com/bwCBpLp.png';
          resolve({
            nickname,
            mode: capitalize(mode),
            rating: x.rating,
            rank: x.rank,
            kd: x.kd,
            adr: x.adr,
            win_rate: x.win_rate,
            top10_rate: x.top10_rate,
            matches: x.matches,
            rank_avg: x.rank_avg,
            kills: x.kills,
            wins: x.wins,
            top10: x.top10,
            image: x.image,
            tier: x.tier,
            ico,
            headshots: x.headshots,
          });
        } else {
          reject(i18.t([`${this.vars.lng}:error.nomatches`, 'error.nomatches'], { nickname, mode }));
        }
      }).catch(e => reject(e));
    });
  }

  lastGames(nickname) {
    return new Promise((resolve, reject) => {
      this.getIDopgg(nickname).then((api) => {
        axios.get(`https://pubg.op.gg/api/users/${api}/matches/recent`).then(response => {
          let x = response.data.matches.items;
          if (x.length < 6) {
            return reject(i18.t([`${this.vars.lng}:error.notenough`, 'error.notenough'], { nickname }))
          }
          let mykd = 0, myavg = 0, myrank = 0, date = 0, allStats = [];
          x.forEach((item, i) => {
            if (i >= 10) return;
            if (i === 0) {
              date = moment(item.started_at).fromNow();
            }
            const place = parseInt(item.participant.stats.rank);
            let rating = Math.round(item.participant.stats.rating_delta);
            if (rating >= 0) rating = `+${rating}`;
            let a = ':crying_cat_face:';
            if (place === 1) a = ':trophy:';
            else if (place === 2) a = ':second_place:';
            else if (place === 3) a = ':third_place:';
            else if (place <= 10) a = ':medal:';
            else if (parseInt(rating) >= 0) a = ':slight_smile:';
            else a = ':crying_cat_face:';
            let mode = item.queue_size === 4 ? 'Squad ' : item.queue_size === 2 ? 'Duo ' : 'Solo ';
            mode = mode + item.mode.charAt(0).toUpperCase() + item.mode.slice(1);
            const kills = item.participant.stats.combat.kda.kills;
            const adr = item.participant.stats.combat.damage.damage_dealt;
            mykd += kills;
            myavg += adr;
            myrank += place;
            let end = ''; const check = mode + place;
            if (check.length < 12) end = ' ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠ ⁠';
            allStats[i] = {
              name: `${i + 1}) ${mode} - #${place} ${a} ${item.server.replace('pc-', '')}${end}`,
              value: `Kills: **${kills}**, Damage: **${adr}**`,
              inline: true,
            };
          });
          mykd = Math.round(mykd / 10 * 100) / 100;
          myavg = Math.round(myavg / 10);
          myrank = Math.round(myrank / 10 * 10) / 10;
          const description = `\`\`\`cpp\nAverage stats in recent 10 games:\nK/D: ${mykd}, ADR: ${myavg}, Rank: #${myrank}\`\`\``;
          resolve({
            embed: {
              description,
              fields: allStats,
              author: {
                name: `[${nickname}] Last game: ${date}. Click here for more!`,
                url: `https://pubg.op.gg/user/${nickname}`,
                icon_url: 'https://i.imgur.com/Q4dQIRm.png',
              },
              footer: {
                icon_url: this.vars.img.footer,
                text: `${this.vars.footer} - Last 10 Games`,
              },
              timestamp: new Date(),
            },
          });
        }).catch(error => {
          const temp = error.response ? error.response.status : 'null';
          reject(i18.t([`${this.vars.lng}:error.http.${temp}`, `error.http.${temp}`, 'error.http.null']));
          console.error(`lastGames Error: ${error.response.status} = ${error.response.statusText}`);
        })
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/[ft]pp/i, match => match.toUpperCase());
}

module.exports = Pubg;