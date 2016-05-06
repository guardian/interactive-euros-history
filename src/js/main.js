import reqwest from 'reqwest'
import d3 from 'd3'
import moment from 'moment'
moment.locale('en-gb')
import lodash from 'lodash'

import mainHTML from './text/main.html!text'

import share from './lib/share'
import sankeyChart from './components/sankeyChart'


var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');

//globals
var _ = lodash;
var rData;
var rJson;
var data = {};
var valueFields = [];

var margin = {top: 2, right: 20, bottom: 20, left: 0};

export function init(el, context, config, mediator) {
    el.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);

    reqwest({
        url: 'https://interactive.guim.co.uk/docsdata-test/1dr847K-aeJ9yXUtsCoW-vLBZSQmE-8bvQUvSD_ptVXY.json', 
        type: 'json',
        crossOrigin: true,
        success: (resp) => dataInit(resp) //loadData()
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}


function dataInit(resp){

    rData = resp.sheets.Sheet1;

    rData = _.remove(rData, function(d) {
          return d.Date != '';
        });

    _.forEach(rData, function(d,k){

        d.date = new Date(manualDateFormat(d.Date))
        d.d3Date = moment(d.date).format("DD-MM-YYYY")
        d.tourney = getTournament(d.date)
        d.round = getRound(d)
        d.goals = d.Score.split("-") 
        d.homeGoals = checkNum(d.goals[0])
        d.awayGoals =  checkNum(d.goals[1])
        d.groupRound = Number(d.groupRound)

        d.notes = String(d.MatchNotes1 +' '+ d.MatchNotes2 +' '+ d.MatchNotes3 +' '+ d.MatchNotes4 +' '+ d.MatchNotes5 +' '+ d.MatchNotes6 +' '+ d.MatchNotes7 +' '+ d.MatchNotes8 +' '+ d.MatchNotes9 +' '+ d.MatchNotes10 +' '+ d.MatchNotes11 +' '+ d.MatchNotes12 +' '+ d.MatchNotes13 +' '+ d.MatchNotes14 +' '+ d.MatchNotes15 +' '+ d.MatchNotes16);
        delete d.MatchNotes1; delete d.MatchNotes2; delete d.MatchNotes3; delete d.MatchNotes4; delete d.MatchNotes5; delete d.MatchNotes6; delete d.MatchNotes7; delete d.MatchNotes8; delete d.MatchNotes9;  delete d.MatchNotes10; delete d.MatchNotes11;  delete d.MatchNotes12;  delete d.MatchNotes13;  delete d.MatchNotes14;  delete d.MatchNotes15;  delete d.MatchNotes16;
        valueFields.push(d.tourney) 

    })

    valueFields = _.uniq(valueFields); //create an array of tourney years
    rData = _.groupBy(rData, function(d) { return d.tourney});

    // work out teams that progress and handle first 2 rounds of groups
    _.forEach(rData, function(a,k){
            
         _.forEach(a, function (d,k){
            d.result = getWDL(d)
            d.source = d.tourney+"_"+k
            if(d.result == "H"){ d.winner = d.Home }

            if(d.result == "A"){ d.winner = d.Away }   
            if(d.WinningTeam){ d.winner = d.WinningTeam }

            //Flow through groups - winning team var added to spreadsheet to handle this    
            if(d.result == "H" && d.groupRound == 3){ d.winner = d.WinningTeam;}    
            if(d.result == "A" && d.groupRound == 3){ d.winner = d.WinningTeam;}      
            if(d.groupRound==1 || d.groupRound==2 ){ d.winner = "groupGame" }  

         })

    })

    // add next matches for winners
    _.forEach(rData, function(a,k){
        
         _.forEach(a, function (d,k){

            if(d.matchRound!="Final" && d.winner!="groupGame"){  d.target = getTargetMatch(a,d); }; //console.log(d.target) console.log(d.round+" none final game");
            if(d.winner=="groupGame"){ d.target = getTargetMatch(a,d); }; //console.log(d.matchRound, " handle group game and handle round of 16 here --- "+d)
            if(d.matchRound=="Final"){ delete d.target; };         

         })

    }) 
 
    getDataObj(rData)
    
}


function getTargetMatch(a,currObj){

        var s;

            _.forEach(a, function(nextObj){

                // handle ko matches
                if ( !currObj.groupRound && nextObj.round == (currObj.round +1) && nextObj.Home == currObj.winner ){ s = nextObj.source };
                if ( !currObj.groupRound && nextObj.round == (currObj.round +1) && nextObj.Away == currObj.winner ){ s = nextObj.source }; 

                //handle round 3 of group games
                if( currObj.groupRound && currObj.winner != "groupGame" && currObj.winner==nextObj.Home ) { s = nextObj.source }
                if( currObj.groupRound && currObj.winner != "groupGame" && currObj.winner==nextObj.Away ) { s = nextObj.source }

                //handle round 2 of group games
                // if( currObj.groupRound==2 && nextObj.groupRound==3 && currObj.Home==nextObj.Home ) { s = nextObj.source }
                // if( currObj.groupRound==2 && nextObj.groupRound==3 && currObj.Home==nextObj.Away ) { s = nextObj.source }
                // if( currObj.groupRound==2 && nextObj.groupRound==3 && currObj.Away==nextObj.Home ) { s = nextObj.source }
                // if( currObj.groupRound==2 && nextObj.groupRound==3 && currObj.Away==nextObj.Away ) { s = nextObj.source }  

                //handle round 1 of group games
                // if( currObj.groupRound==1 && nextObj.groupRound==2 && currObj.Home==nextObj.Home ) { s = nextObj.source }
                // if( currObj.groupRound==1 && nextObj.groupRound==2 && currObj.Home==nextObj.Away ) { s = nextObj.source }
                // if( currObj.groupRound==1 && nextObj.groupRound==2 && currObj.Away==nextObj.Home ) { s = nextObj.source }
                // if( currObj.groupRound==1 && nextObj.groupRound==2 && currObj.Away==nextObj.Away ) { s = nextObj.source }      

            })

        return s

} 


function getDataObj(rData){

    _.forEach(rData, function (a, k){ 

        var chartRef = k

        //set up graph in same style as original example but empty    
        var graph = { "nodes" : [], "links" : [] };

            _.forEach(a, function(o,k){
               // console.log(a.length,k)
                graph.nodes.push({ "name": o.source, "data":o });
                if(k > 0){
                    graph.links.push({ "source": o.source, "target": o.target, "value": 2 });
                }

                if (k==0){
                    graph.links.push({ "source": o.source, "value": 2 });
                }

    })
 
    // return only the distinct / unique nodes
         graph.nodes = d3.keys(d3.nest()
           .key(function (d) { return d.name; })
           .map(graph.nodes));

     // loop through each link replacing the text with its index from node
         graph.links.forEach(function (d, i) {
           graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
           graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
         });

     //now loop through each nodes to make nodes an array of objects
     // rather than an array of strings
         graph.nodes.forEach(function (d, i) {
           graph.nodes[i] = { "name": d };
         }); 
        
        addCharts(graph,chartRef)

    })


}


function addCharts(_root,chartRef){
        var options = {}
        options.container = "#chartHolder";
        options.chartContainer = "chart_"+chartRef;
        options.year = chartRef
        options.dataObj = _root;

        new sankeyChart(d3, options, margin, rData)
 
}

function checkNum(n){
    
    if(isNaN(n)) { n = 0 }
    
    return n
}

function getWDL(d){
    var s = "D";

        if (d.homeGoals > d.awayGoals){ s = "H" }
        if (d.homeGoals < d.awayGoals){ s = "A" }
    
    return s;    
}


function getRound(d){

    var t = 1;
    
        if(d.groupRound ){ 
            t = Number(d.groupRound) 
        };

        if (d.tourney == 1980) {
            // 1980 group winners straight to final
            if (d.matchRound=="Final"){ t = 4 }   
        }

        if(d.tourney > 1980 && d.tourney < 94 ) {
            //No Quarter-finals - group winners straight to semi 84-92
            if (d.matchRound=="Semi-finals"){ t = 4 }  
            if (d.matchRound=="Final"){ t = 5 }    
        }

        if(d.tourney < 1984 && d.tourney > 92 )   
        {
            if (d.matchRound=="Round of 16") { t = 3 }
            if (d.matchRound=="Quarter-finals"){ t = 4 }
                //Quarter-finals
            if (d.matchRound=="Semi-finals"){ t = 5 }  
            if (d.matchRound=="Final"){ t = 6 }   
        } 

    return t
}


function getTournament(d){
    var y = moment(d).format("YYYY")
        
        if (y == '1958'){ y='1960'}
        if (y == '1959'){ y='1960'}
        if (y == '1963'){ y='1964'}

    return y;
}

function manualDateFormat(s){
    var a = s.split("/"); 
    s = a[1]+"-"+a[0]+"-"+a[2]

    return(s) 
}


// Working test data for sankey graph
// console.log(graph)
    //     graph = {
    //         "nodes":[
    //         {"name":"A1"},//0
    //         {"name":"A1"},//1
    //         {"name":"B1"},//2
    //         {"name":"B1"},//3
    //         {"name":"C1"},//4
    //         {"name":"C1"},//5
    //         {"name":"D1"},//6
    //         {"name":"D1"},//7
    //         {"name":"A2"},//8
    //         {"name":"A2"},//9
    //         {"name":"B2"},//10
    //         {"name":"B2"},//11
    //         {"name":"C2"},//12
    //         {"name":"C2"},//13
    //         {"name":"D2"},//14
    //         {"name":"D2"},//15
    //         {"name":"A3"},//16
    //         {"name":"A3"},//17
    //         {"name":"B3"},//18
    //         {"name":"B3"},//19
    //         {"name":"C3"},//20
    //         {"name":"C3"},//21
    //         {"name":"D3"},//22
    //         {"name":"D3"},//23            
    //         {"name":"QF1"}, //24
    //         {"name":"QF2"}, //25
    //         {"name":"QF3"}, //26
    //         {"name":"QF4"},//, //27
    //         {"name":"SF1"}, //28
    //         {"name":"SF2"}, //29             
    //         {"name":"FINAL"} //30 
    //         ],
    //         "links":[
    //         {"source":0,"target":8,"value":1},
    //         {"source":1,"target":9,"value":1}, //source:Match, target:nextRound, value: winning teams goals
    //         {"source":2,"target":10,"value":1},
    //         {"source":3,"target":11,"value":3},
    //         {"source":4,"target":12,"value":3},
    //         {"source":5,"target":13,"value":6},
    //         {"source":6,"target":14,"value":2},
    //         {"source":7,"target":15,"value":1}, //source:Match, target:nextRound, value: winning teams goals
    //         {"source":8,"target":16,"value":1},
    //         {"source":9,"target":17,"value":3},
    //         {"source":10,"target":18,"value":3},
    //         {"source":11,"target":19,"value":6},
    //         {"source":12,"target":20,"value":2},
    //         {"source":13,"target":21,"value":1},
    //         {"source":14,"target":22,"value":1}, //source:Match, target:nextRound, value: winning teams goals
    //         {"source":15,"target":23,"value":1},
    //         {"source":16,"target":24,"value":3},
    //         {"source":17,"target":25,"value":3},
    //         {"source":18,"target":25,"value":6},
    //         {"source":19,"target":24,"value":2},
    //         {"source":20,"target":26,"value":1}, //source:Match, target:nextRound, value: winning teams goals
    //         {"source":21,"target":27,"value":1},
    //         {"source":22,"target":27,"value":3},
    //         {"source":23,"target":26,"value":3},
    //         {"source":24,"target":28,"value":6}, //QF1
    //         {"source":25,"target":29,"value":2}, //QF2
    //         {"source":26,"target":28,"value":6}, //QF3
    //         {"source":27,"target":29,"value":2}, //QF4
    //         {"source":28,"target":30,"value":12}, //SF1
    //         {"source":29,"target":30,"value":4} //SF2
    //        // {"source":30,"target":null,"value":6}  //DON'T LINK THE FINAL IT THROWS AN ERROR 

    //         ]}
