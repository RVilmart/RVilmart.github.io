

// Diagram Generation //

function getFrequencies(d){
  var all_f = 0;
  var sum_f = 0;
  var res = [];
  for (var key in d){
    all_f += d[key];
  }
  for (var key in d){
    sum_f += d[key]/all_f;
    res.push([key, sum_f])
  }
  return res;
}

function getKeyFromProb(specs, p){
  for(var i = 0; specs[i][1] < p; i++){}
  return specs[i][0];
}

function randomCircuit(q, N, gate_specs, angle_specs, anc, disc){
  // q is the number of qubits
  // N is the number of gates
  // specs is a dictionary of the form {"gate":<frequency>}
  // angles is a dictionary of the form {"angle":<frequency>}
  // the frequencies do not need to add up to 1, they are renormalised
  // anc is a range giving the number of ancillae, initialised at |0>
  // disc is a range giving the number of discards
  var fresh_node_id = 0;
  if (gate_specs===undefined){
    gate_specs = {"Z":1, "X":1, "H":1, "CX":1, "CZ":1};
  }
  if (angle_specs===undefined){
    angle_specs = {"π/2":1, "π":1, "3π/2":1};
  }
  var gates = getFrequencies(gate_specs);
  var angles = getFrequencies(angle_specs);
  if (N===undefined){
    N = 5*q;
  }
  if (anc === undefined){ anc = [0,0];}
  if (typeof anc === "number"){ anc = [anc,anc];}
  nb_anc = anc[0]+Math.floor((anc[1]-anc[0]+1)*Math.random());
  if (disc === undefined){ disc = [0,0]; }
  if (typeof disc === "number"){ disc = [disc,disc];}
  nb_disc = disc[0]+Math.floor((disc[1]-disc[0]+1)*Math.random());
  var nodes = [];
  var layer = [];
  var edges = [];
  for (var i=0; i<q; i++){
    layer.push(fresh_node_id);
    nodes.push({ id: fresh_node_id, label: "i"+i, group: "b" });
    fresh_node_id++;
  }
  for (var i=0; i<nb_anc; i++){
    layer.push(fresh_node_id);
    nodes.push({ id: fresh_node_id, label: "", group: "X" });
    fresh_node_id++;
  }
  q = q+nb_anc;
  for (var i=0; i<N; i++){
    var gate = getKeyFromProb(gates, Math.random());
    var q0 = Math.floor(q*Math.random());
    if (["CX","CZ"].includes(gate)){
      var q1 = q0;
      while (q1===q0){
        q1 = Math.floor(q*Math.random());
      }
    }
    if (["X","Z"].includes(gate)){
      var a = getKeyFromProb(angles, Math.random());
    }
    switch (gate){
      case "Z":
        nodes.push({id: fresh_node_id, label: a, group: "Z"});
        edges.push({from:layer[q0], to:fresh_node_id});
        layer[q0] = fresh_node_id;
        fresh_node_id++;
        break;
      case "X":
        nodes.push({id: fresh_node_id, label: a, group: "X"});
        edges.push({from:layer[q0], to:fresh_node_id});
        layer[q0] = fresh_node_id;
        fresh_node_id++;
        break;
      case "H":
        nodes.push({id: fresh_node_id, label: "", group: "H"});
        edges.push({from:layer[q0], to:fresh_node_id});
        layer[q0] = fresh_node_id;
        fresh_node_id++;
        break;
      case "CX":
        nodes.push({id: fresh_node_id, label: "", group: "Z"});
        edges.push({from:layer[q0], to:fresh_node_id});
        layer[q0] = fresh_node_id;
        fresh_node_id++;
        nodes.push({id: fresh_node_id, label: "", group: "X"});
        edges.push({from:layer[q1], to:fresh_node_id});
        edges.push({from:fresh_node_id-1, to:fresh_node_id});
        layer[q1] = fresh_node_id;
        fresh_node_id++;
        break;
      case "CZ":
        nodes.push({id: fresh_node_id, label: "", group: "Z"});
        edges.push({from:layer[q0], to:fresh_node_id});
        layer[q0] = fresh_node_id;
        fresh_node_id++;
        nodes.push({id: fresh_node_id, label: "", group: "H"});
        edges.push({from:fresh_node_id-1, to:fresh_node_id});
        fresh_node_id++;
        nodes.push({id: fresh_node_id, label: "", group: "Z"});
        edges.push({from:layer[q1], to:fresh_node_id});
        edges.push({from:fresh_node_id-1, to:fresh_node_id});
        layer[q1] = fresh_node_id;
        fresh_node_id++;
        break;
    }
  }
  for (var i=0; i<nb_disc; i++){
    nodes.push({ id: fresh_node_id, label: "", group: "bang" });
    edges.push({ from:layer[i], to:fresh_node_id});//, arrows: {to:{enabled: true, type: "image", src:"ressources/discard.svg"}}});
    fresh_node_id++;
  }
  for (var i=nb_disc; i<q; i++){
    nodes.push({ id: fresh_node_id, label: "o"+(i-nb_disc), group: "b" });
    edges.push({ from:layer[i], to:fresh_node_id});
    fresh_node_id++;
  }
  return [new vis.DataSet(nodes),new vis.DataSet(edges)];
}



// Manipulation of ZX-diagrams //

function initZX(div_id, nodes, edges, method){
  // div_id is the id of the div that will contain the diagram
  // nodes is an array of dictionaries in the form { id:<id>, label:<label>, group:<group> }
  // edges is an array of dictionaries in the form { from:<node_id>, to:<node_id> }

  $("body").append(
  `<div class="modal fade" tabindex="-1" role="dialog" id="EdgeDbClickModal`+div_id+`" aria-labelledby="ModalLabel">
    <div class="modal-dialog modal-sm" role="document">
      <div class="modal-content">
        <div class="modal-header" style="cursor:move;">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title noselect">Choose an action</h4>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-4"><button type="button" id="HButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">&ensp;<img src="ressources/H-2.png">&ensp;</button></div>
            <div class="col-md-4"><button type="button" id="ZButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">&ensp;<img src="ressources/gn.png">&ensp;</button></div>
            <div class="col-md-4"><button type="button" id="XButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">&ensp;<img src="ressources/rn.png">&ensp;</button></div>
          </div>
        </div>
      </div>
    </div>
  </div>`)

  $("body").append(
  `<div class="modal fade" tabindex="-1" role="dialog" id="SimpModal`+div_id+`" aria-labelledby="ModalLabel">
    <div class="modal-dialog modal-sm" role="document">
      <div class="modal-content">
        <div class="modal-header" style="cursor:move;">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title noselect">Choose an action</h4>
        </div>
        <div class="modal-body">
          <button type="button" id="SpiderButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal" >All Spiders</button><br>
          <button type="button" id="SpiderHButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">All Spiders ++</button><br>
          <button type="button" id="HopfButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">All Hopf</button><br>
          <button type="button" id="HInvolutionButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">All H Involutions</button><br>
          <button type="button" id="CopyButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">All Copies</button><br>
          <button type="button" id="AllSimpsButton`+div_id+`" class="btn btn-default" autocomplete="off" data-dismiss="modal">All Obvious Simplifications</button>
        </div>
      </div>
    </div>
  </div>`)

  $(".modal-header").on("mousedown", function(mousedownEvt) {
      var $draggable = $(this);
      var x = mousedownEvt.pageX - $draggable.offset().left,
          y = mousedownEvt.pageY - $draggable.offset().top;
      $("body").on("mousemove.draggable", function(mousemoveEvt) {
          $draggable.closest(".modal-dialog").offset({
              "left": mousemoveEvt.pageX - x,
              "top": mousemoveEvt.pageY - y
          });
      });
      $("body").one("mouseup", function() {
          $("body").off("mousemove.draggable");
      });
      $draggable.closest(".modal").one("bs.modal.hide", function() {
          $("body").off("mousemove.draggable");
      });
  });

  $('#'+div_id).keypress(function(event) {
    var keyCode = event.which;
    if (keyCode===115){
      $('#SimpModal'+div_id).modal();
    }
  });

  var EdgeDbClick = undefined;
  var EdgeDbClickConnectedNodes = undefined;

  var data = {
    nodes: nodes,
    edges: edges
  }
  var fresh_node_id = data.nodes.length; // a counter that keeps track of the last used node id

  function addNode(gp, l, x, y) {
    nodes.add({ id: fresh_node_id, label: l, group: gp, x: x, y: y });
    fresh_node_id++;
  }

  function addBangs(node_ids, x, y) {
    // Creates discards and link it to node_ids
    // node_ids can be either a list or a single node id
    if (typeof node_ids ==="number") {node_ids = [ node_ids ]}
    for (node_id of node_ids){
      nodes.add({ id: fresh_node_id, label: "", group: "bang", x: x, y: y });
      fresh_node_id++;
      edges.add({from:node_id, to:fresh_node_id-1, arrows: {to:{enabled: true, type: "image", src:"ressources/discard.svg"}}});
    }
  }

  function removeNode(node_id){
    // removes a node and its associated edges
    var edges_node = network.getConnectedEdges(node_id);
    nodes.remove({ id: node_id });
    for (edge of edges_node){
      edges.remove({id: edge});
    }
  }

  function gcd(a, b) {
    if (!b) { return a; }
    return gcd(b, a % b);
  }

  function rat2label(r){
    // turns a rational (int*int) into a label for ZX-nodes
    r[0] = r[0] % (2*r[1]);
    var g = gcd(r[0],r[1]);
    r[0] = r[0]/g;
    r[1] = r[1]/g;
    if (r[0]===0) { return ""; }
    if (r[0]===1 && r[1]===1) { return "π"; }
    if (r[0]===1) { return "π/"+r[1].toString(); }
    return r[0].toString()+"π/"+r[1].toString();
  }

  function label2rational(l){
    // turns a ZX label into a rational
    if (l==="") { return [0,1]; }
    if (l==="π") { return [1,1]; }
    var r = l.split("π/");
    if (r[0]==="") { r[0]="1"; }
    return [Number(r[0]), Number(r[1])];
  }

  function addLabels(l1, l2) {
    var r1 = label2rational(l1);
    var r2 = label2rational(l2);
    return rat2label([r1[0]*r2[1]+r1[1]*r2[0], r1[1]*r2[1]]);
  }

  function minusLabel(l){
    var r = label2rational(l);
    return rat2label([2*r[1]-r[0], r[1]]);
  }

  function getNodeById(node_id){
    for (node of nodes.get()){
      if (node.id===node_id){
        return node;
      }
    }
    return undefined;
  }

  function getEdgeById(edge_id){
    for (edge of edges.get()){
      if (edge.id===edge_id){
        return edge;
      }
    }
    return undefined;
  }

  function getConnectedNodesMult(node_id){
    // Get the connected nodes with multiplicity
    return network.getConnectedEdges(node_id).map(getEdgeById).map(e => {if(e.to===node_id){return e.from;}else{return e.to;}});
  }

  function merge(node1, node2){
    // merges nodes 1 and 2 into the ZX-diagram
    // they are supposed to have the same type
    var node1pos = network.getPosition(node1.id);
    var node2pos = network.getPosition(node2.id);
    network.moveNode(node2.id, (node1pos.x+node2pos.x)/2, (node1pos.y+node2pos.y)/2);
    nodes.update([{ id: node2.id, label: addLabels(node1.label,node2.label) }]);
    for (edge of edges.get()){
      if (edge.from===node1.id && edge.to!==node2.id){
        edges.add({ from: node2.id, to:edge.to});
      }else if (edge.to===node1.id && edge.from!==node2.id){
        edges.add({ to: node2.id, from:edge.from});
      }
    }
    removeNode(node1.id);
  }

  function applyZXCopy(node1,node2){
    // node1 gets copied through node2
    var neighbours = network.getConnectedNodes(node2.id);
    var pos = network.getPosition(node2.id);
    for (node of neighbours){
      if (node !== node1.id){
        addNode(node1.group, node1.label, pos.x+5*(Math.random()-0.5), pos.y+5*(Math.random()-0.5)); // is the label copied?
        edges.add({ from: node, to:fresh_node_id-1});
      }
    }
    removeNode(node1.id);
    removeNode(node2.id);
  }

  function applyZXBialgebra(node1, node2){
    var neighbours1 = network.getConnectedNodes(node1.id);
    var pos1 = network.getPosition(node1.id);
    var neighbours2 = network.getConnectedNodes(node2.id);
    var pos2 = network.getPosition(node2.id);
    var ind1 = fresh_node_id;
    for (node of neighbours1){
      if (node !== node2.id){
        addNode(node2.group, node2.label, pos1.x+5*(Math.random()-0.5), pos1.y+5*(Math.random()-0.5)); // is the label copied?
        edges.add({ from: node, to:fresh_node_id-1});
      }
    }
    var ind2 = fresh_node_id;
    for (node of neighbours2){
      if (node !== node1.id){
        addNode(node1.group, node1.label, pos2.x+5*(Math.random()-0.5), pos2.y+5*(Math.random()-0.5)); // is the label copied?
        edges.add({ from: node, to:fresh_node_id-1});
      }
    }
    for (var i = ind1; i < ind2; i++){
      for (var j = ind2; j < fresh_node_id; j++){
        edges.add({ from: i, to:j});
      }
    }
    removeNode(node1.id);
    removeNode(node2.id);
  }

  function applyHInvolution(node1, node2){
    var neighbour1 = (network.getConnectedNodes(node1.id)).filter(node_id => node_id!==node2.id)[0];
    var neighbour2 = (network.getConnectedNodes(node2.id)).filter(node_id => node_id!==node1.id)[0];
    if (neighbour1!==neighbour2){
      edges.add({ from: neighbour1, to: neighbour2});
    }
    removeNode(node1.id);
    removeNode(node2.id);   
  }

  function applyColourChange(node1, node2){
    // node1 is X or Z, node2 is H
    var neighbour2 = (network.getConnectedNodes(node2.id)).filter(node_id => node_id!==node1.id)[0];
    if (neighbour2 === undefined){
      // H-loop
      removeNode(node2.id);
      nodes.update([{ id: node1.id, label: addLabels(node1.label,"π") }]);
      return ;
    }
    var pos = network.getPosition(node1.id);;
    var neighbours = getConnectedNodesMult(node1.id);
    var ind1 = fresh_node_id;
    addNode({"Z":"X", "X":"Z"}[node1.group], node1.label, pos.x, pos.y);
    for (current_node of neighbours){
      if (current_node!==node2.id){
        //current_node = getNodeById(current_node);
        current_node = nodes.get(current_node);
        var node_neighbours = network.getConnectedNodes(current_node.id);
        if (node_neighbours.length===1 && current_node.group==="H"){
          // H-loop, do nothing
          edges.add({ from: current_node.id, to: ind1});
          edges.add({ from: ind1, to: current_node.id});
        }else if(current_node.group==="H"){
          // H-involution
          var neigh_neigh = (network.getConnectedNodes(current_node.id)).filter(node_id => node_id!==node1.id)[0];
          edges.add({ from: ind1, to:neigh_neigh});
          removeNode(current_node.id);
        }else{
          var pos_aux = network.getPosition(current_node.id);
          addNode("H", "",  (pos.x+pos_aux.x)/2, (pos.y+pos_aux.y)/2);
          edges.add({ from: current_node.id, to: fresh_node_id-1});
          edges.add({ from: ind1, to: fresh_node_id-1});
        }
      }
    }
    edges.add({ from:ind1, to:neighbour2});
    removeNode(node1.id);
    removeNode(node2.id);
  }

  function applyPiCommutation(node1, node2){
    // node2 is the pi-node
    var neighbour2 = (network.getConnectedNodes(node2.id)).filter(node_id => node_id!==node1.id)[0];
    var pos = network.getPosition(node1.id);
    var neighbours = getConnectedNodesMult(node1.id);
    var ind1 = fresh_node_id;
    addNode(node1.group, minusLabel(node1.label), pos.x, pos.y);

    for (current_node of neighbours){
      if (current_node!==node2.id){
        //current_node = getNodeById(current_node);
        current_node = nodes.get(current_node);
        var node_neighbours = network.getConnectedNodes(current_node.id);
        if (node_neighbours.length===1 && current_node.label==="π"){
          // π-loop, do nothing
          edges.add({ from: current_node.id, to: ind1});
          edges.add({ from: ind1, to: current_node.id});
        /*}else if(node.label==="π" && node.group===node2.group){
          // π-involution
          nodes.update([{ id: node.id, label: "" }]);
          edges.add({ from: ind1, to:node.id});*/
        }else{
          var pos_aux = network.getPosition(current_node.id);
          addNode(node2.group, "π",  (pos.x+pos_aux.x)/2, (pos.y+pos_aux.y)/2);
          edges.add({ from: current_node.id, to: fresh_node_id-1});
          edges.add({ from: ind1, to: fresh_node_id-1});
        }
      }
    }
    edges.add({ from:ind1, to:neighbour2});
    removeNode(node1.id);
    removeNode(node2.id);
  }

  function bangEatsU(node1, node2) {
    // node1 is a bang, node2 is a 1-qbit unitary
    var neighbour = (network.getConnectedNodes(node2.id)).filter(node_id => node_id!==node1.id)[0];
    removeNode(node2.id);
    edges.add({from:neighbour, to:node1.id});
  }

  function bangEatsU2(node1, node2) {
    // node1 and node2 are bangs
    //var neighbour1 = getNodeById(network.getConnectedNodes(node1.id)[0]);
    //var neighbour2 = getNodeById(network.getConnectedNodes(node2.id)[0]);
    var neighbour1 = nodes.get(network.getConnectedNodes(node1.id)[0]);
    var neighbour2 = nodes.get(network.getConnectedNodes(node2.id)[0]);
    var n1_neighbours = (network.getConnectedNodes(neighbour1.id)).filter(node_id => node_id!==node1.id);
    var n2_neighbours = (network.getConnectedNodes(neighbour2.id)).filter(node_id => node_id!==node2.id);
    var common_edges = (network.getConnectedEdges(neighbour1.id)).filter(edge_id => (network.getConnectedEdges(neighbour2.id)).includes(edge_id));
    if (["XZ","ZX"].includes(neighbour1.group+neighbour2.group) && common_edges.length!==0){
      // CNot
      for (edge of common_edges){
        edges.remove({id: edge});
      }
      applyBangRules(node1,neighbour1);
      applyBangRules(node2,neighbour2);
      return;
    }
    var common_Us = (n1_neighbours.filter(node_id => n2_neighbours.includes(node_id)));
    //common_Us = common_Us.map(getNodeById);
    common_Us = common_Us.map(node_id => nodes.get(node_id));
    common_Us = common_Us.filter(node => node.group==="H" || ["π/2","3π/2"].includes(node.label));
    common_Us = common_Us.filter(node => network.getConnectedEdges(node.id).length===2);
    if (["XX","ZZ"].includes(neighbour1.group+neighbour2.group) && common_Us.length!==0){
      // CZ or similar
      for (node of common_Us){
        removeNode(node.id);
      }
      applyBangRules(node1,neighbour1);
      applyBangRules(node2,neighbour2);
      return;
    }
    // We create a CNot controlled by the edge of node1
    edges.remove({id: network.getConnectedEdges(node1.id)[0]});
    edges.remove({id: network.getConnectedEdges(node2.id)[0]});
    var pos1 = network.getPosition(node1.id);
    var pos_n1 = network.getPosition(neighbour1.id);
    var pos2 = network.getPosition(node2.id);
    var pos_n2 = network.getPosition(neighbour2.id);
    addNode("Z", "", (pos1.x+pos_n1.x)/2, (pos1.y+pos_n1.y)/2);
    edges.add({from:node1.id, to:fresh_node_id-1});
    edges.add({from:neighbour1.id, to:fresh_node_id-1});
    addNode("H", "", (pos1.x+pos_n1.x+pos2.x+pos_n2.x)/4, (pos1.y+pos_n1.y+pos2.y+pos_n2.y)/4);
    edges.add({from:fresh_node_id-2, to:fresh_node_id-1});
    addNode("Z", "", (pos2.x+pos_n2.x)/2, (pos2.y+pos_n2.y)/2);
    edges.add({from:node2.id, to:fresh_node_id-1});
    edges.add({from:neighbour2.id, to:fresh_node_id-1});
    edges.add({from:fresh_node_id-2, to:fresh_node_id-1});
  }

  function applyBangRules(node1, node2){
    // one of the 2 nodes is a bang
    if (node1.group!=="bang"){ return applyBangRules(node2, node1); }
    // node1 is now a bang
    var neighbours = network.getConnectedNodes(node2.id);
    if (neighbours.length===2){
      bangEatsU(node1, node2);
      return ;
    }
    if (neighbours.length===1){
      // case of a scalar
      removeNode(node1.id);
      removeNode(node2.id);
      return ;
    }
    if (["X","Z"].includes(node2.group)){
      nodes.update([{ id: node2.id, label: "" }]);
      var pos = network.getPosition(node2.id);
      network.moveNode(node2.id,pos.x,pos.y);
      return ;
    }
  }

  function applyZXRule(nodes_id) {
    if (nodes_id.length!==2){return ;}
    //var node1 = getNodeById(nodes_id[0]);
    //var node2 = getNodeById(nodes_id[1]);
    var node1 = nodes.get(nodes_id[0]);
    var node2 = nodes.get(nodes_id[1]);
    if (node1.group==="b" || node2.group==="b"){network.unselectAll(); return ;}
    if (network.getConnectedNodes(node1.id).includes(node2.id)){
      // the two nodes are adjacent
      if (node1.group===node2.group && ["Z","X"].includes(node1.group)){
        // the two nodes are of the same type, X or Z
        // We apply the spider rule
        merge(node1, node2);
        network.unselectAll();
        return ;
      }
      if (["Z","X"].includes(node1.group) && ["Z","X"].includes(node2.group)){
        // The two nodes are Z and X
        var edges_node1 = network.getConnectedEdges(node1.id);
        var edges_node2 = network.getConnectedEdges(node2.id);
        var connecting_edges = (edges_node1).filter(value => (edges_node2).includes(value));
        if (connecting_edges.length > 1){
          // We apply the Hopf Law *once*
          edges.remove({id: connecting_edges[0]}); // only removal by id is possible...
          edges.remove({id: connecting_edges[1]}); // only removal by id is possible...
          network.unselectAll();
          return ;
        }
        if (connecting_edges.length === 1){
          // Bialgebra, copy,...
          if (edges_node1.length===1 && ["","π"].includes(node1.label)){
            // Copy /!\ deal with scalars first
            applyZXCopy(node1,node2);
            network.unselectAll();
            return ;
          }
          if (edges_node2.length===1 && ["","π"].includes(node2.label)){
            // Copy /!\ deal with scalars first
            applyZXCopy(node2,node1);
            network.unselectAll();
            return ;
          }
          if (["","π"].includes(node1.label) && ["","π"].includes(node2.label)){
            // Bialgebra (potentially with pi)
            applyZXBialgebra(node1, node2);
            network.unselectAll();
            return ;
          }
          if (edges_node1.length===2 && node1.label==="π"){
            // pi-commutation
            applyPiCommutation(node2,node1);
            network.unselectAll();
            return ;
          }
          if (edges_node2.length===2 && node2.label==="π"){
            // pi-commutation
            applyPiCommutation(node1,node2);
            network.unselectAll();
            return ;
          }
        }
      }
      if (node1.group==="H" && node2.group==="H"){
        // H involution
        applyHInvolution(node1, node2);
        network.unselectAll();
        return ;
      }
      if (node1.group==="H" && ["Z","X"].includes(node2.group)){
        // Colour change
        applyColourChange(node2, node1);
        network.unselectAll();
        return ;
      }
      if (node2.group==="H" && ["Z","X"].includes(node1.group)){
        // Colour change
        applyColourChange(node1, node2);
        network.unselectAll();
        return ;
      }
      if ([node1.group, node2.group].includes("bang")){
        applyBangRules(node1,node2);
        network.unselectAll();
        return;
      }
    }
    if (node1.group==="bang" && node2.group==="bang"){
      // CNot
      bangEatsU2(node1,node2);
      network.unselectAll();
      return;
    }
  }

  function applyZXI(node){
    var neighbours = network.getConnectedNodes(node.id);
    edges.add({ from: neighbours[0], to: neighbours[1]});
    removeNode(node.id);
  }

  function applyHDecomp(node){
    var neighbours = network.getConnectedNodes(node.id);
    var neigh1 = neighbours[0];
    var neigh2 = neighbours[0];
    if (neighbours.length===2){
      neigh2 = neighbours[1];
    }
    var pos = network.getPosition(node.id);
    var pos1 = network.getPosition(neigh1);
    var pos2 = network.getPosition(neigh2);
    addNode("Z", "π/2", (pos1.x+pos.x)/2, (pos1.y+pos.y)/2);
    edges.add({ from:fresh_node_id-1, to:neigh1});
    addNode("X", "π/2", pos.x, pos.y);
    edges.add({ from:fresh_node_id-2, to:fresh_node_id-1});
    addNode("Z", "π/2", (pos2.x+pos.x)/2, (pos2.y+pos.y)/2);
    edges.add({ from:fresh_node_id-2, to:fresh_node_id-1});
    edges.add({ from:neigh2, to:fresh_node_id-1});
    removeNode(node.id);
  }

  function applyHRecomp(node){
    var neighbours = getConnectedNodesMult(node.id);
    var pos = network.getPosition(node.id);
    ind1 = fresh_node_id;
    for (neigh of neighbours){
      var pos_aux = network.getPosition(neigh);
      addNode({"Z":"X", "X":"Z"}[node.group], {"π/2":"3π/2", "3π/2":"π/2"}[node.label], (pos_aux.x+pos.x)/2, (pos_aux.y+pos.y)/2);
      edges.add({ from:fresh_node_id-1, to:neigh});
    }
    ind2 = fresh_node_id;
    for (var i = ind1; i < ind2; i++){
      for (var j = i+1; j < ind2; j++){
        addNode("H", "", pos.x, pos.y);
        edges.add({ from: i, to:fresh_node_id-1});
        edges.add({ from: j, to:fresh_node_id-1});
      }
    }
    removeNode(node.id);
  }

  function applyDbClickZXRule(params){
    if (params.nodes.length > 0){ applyDbClickZXRuleNode(params.nodes);}
    else if (params.edges.length > 0){ applyDbClickZXRuleEdge(params.edges);}
    network.unselectAll();
    return ;
  }

  $('#HButton'+div_id).on('click', function(){
    var neighbours = network.getConnectedNodes(EdgeDbClick);
    edges.remove({id: EdgeDbClick});
    var pos1 = network.getPosition(neighbours[0]);
    var pos2 = network.getPosition(neighbours[1]);
    addNode("H", "", (2*pos1.x+pos2.x)/3, (2*pos1.y+pos2.y)/3);
    edges.add({ from: neighbours[0], to:fresh_node_id-1});
    addNode("H", "", (pos1.x+2*pos2.x)/3, (pos1.y+2*pos2.y)/3);
    edges.add({ from: fresh_node_id-2, to:fresh_node_id-1});
    edges.add({ from: neighbours[1], to:fresh_node_id-1});
  });

  $('#ZButton'+div_id).on('click', function(){
    var neighbours = network.getConnectedNodes(EdgeDbClick);
    edges.remove({id: EdgeDbClick});
    var pos1 = network.getPosition(neighbours[0]);
    var pos2 = network.getPosition(neighbours[1]);
    addNode("Z", "", (pos1.x+pos2.x)/2, (pos1.y+pos2.y)/2);
    edges.add({ from: neighbours[0], to:fresh_node_id-1});
    edges.add({ from: neighbours[1], to:fresh_node_id-1});
  });

  $('#XButton'+div_id).on('click', function(){
    var neighbours = network.getConnectedNodes(EdgeDbClick);
    edges.remove({id: EdgeDbClick});
    var pos1 = network.getPosition(neighbours[0]);
    var pos2 = network.getPosition(neighbours[1]);
    addNode("X", "", (pos1.x+pos2.x)/2, (pos1.y+pos2.y)/2);
    edges.add({ from: neighbours[0], to:fresh_node_id-1});
    edges.add({ from: neighbours[1], to:fresh_node_id-1});
  });

  function applyDbClickZXRuleEdge(edges){
    if (edges.length!==1){return ;}
    EdgeDbClick = edges[0];
    $('#EdgeDbClickModal'+div_id).modal();
  }

  function applyDbClickZXRuleNode(nodes_id){
    if (nodes_id.length!==1){return ;}
    //var node = getNodeById(nodes_id[0]);
    var node = nodes.get(nodes_id[0]);
    var edges_node = network.getConnectedEdges(node.id);
    if (edges_node.length === 2 && ["Z","X"].includes(node.group) && node.label===""){
      // apply I
      applyZXI(node);
      network.unselectAll();
      return ;
    }
    if (node.group==="H"){
      // H decomposition
      applyHDecomp(node);
      network.unselectAll();
      return ;          
    }
    if (["Z","X"].includes(node.group) && ["π/2","3π/2"].includes(node.label)){
      // apply π/2 to H
      applyHRecomp(node);
      network.unselectAll();
      return ;
    }
  }

  function SpiderAll(){
    for (current_node of nodes.get()){
      if (["Z","X"].includes(current_node.group)){
        if (current_node.label==="" && network.getConnectedEdges(current_node.id).length===2){
          applyZXI(current_node);
          setTimeout(() => { SpiderAll(); }, 1);
          return true;
        }
        var same_type_neighbours = network.getConnectedNodes(current_node.id);
        //same_type_neighbours = same_type_neighbours.map(getNodeById);
        same_type_neighbours = same_type_neighbours.map(node_id => nodes.get(node_id));
        same_type_neighbours = same_type_neighbours.filter(n => n.group===current_node.group);
        if (same_type_neighbours.length!==0){
          merge(current_node, same_type_neighbours[0]);
          setTimeout(() => { SpiderAll(); }, 1);
          return true;
        }
      }
    }
    return false
  }

  $('#SpiderButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    SpiderAll();
  });

  function SpiderAllH(b) {
    if (b===undefined) { b = false; }
    for (current_node of nodes.get()){
      if (["Z","X"].includes(current_node.group)){
        var same_type_neighbours = network.getConnectedNodes(current_node.id);
        //same_type_neighbours = same_type_neighbours.map(getNodeById);
        same_type_neighbours = same_type_neighbours.map(node_id => nodes.get(node_id));
        same_type_neighbours = same_type_neighbours.filter(n => n.group==="H");
        //same_type_neighbours = same_type_neighbours.map(n => [n,getNodeById(network.getConnectedNodes(n.id).filter(id => id!==current_node.id)[0])]);
        same_type_neighbours = same_type_neighbours.map(n => [n,nodes.get(network.getConnectedNodes(n.id).filter(id => id!==current_node.id)[0])]);
        same_type_neighbours = same_type_neighbours.filter(t => t[1].group==={"X":"Z", "Z":"X"}[current_node.group]);
        if (same_type_neighbours.length!==0){
          applyColourChange(same_type_neighbours[0][1],same_type_neighbours[0][0]);
          setTimeout(() => { SpiderAll(); }, 1);
          setTimeout(() => { SpiderAllH(true); }, 1);
          return true;
        }
      }
    }
    return SpiderAll();  
  }

  $('#SpiderHButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    SpiderAll();
    SpiderAllH();
  });

  function HopfAll(b) {
    if (b===undefined){ b = false; }
    for (current_node of nodes.get()){
      if (["Z","X"].includes(current_node.group)){
        var neighbours = network.getConnectedNodes(current_node.id);
        var current_edges = network.getConnectedEdges(current_node.id);
        var Hneighbours = [];
        for (neighbour of neighbours){
          neighbour = nodes.get(neighbour);
          if (neighbour.group==={"X":"Z", "Z":"X"}[current_node.group]){
            var common_edges = network.getConnectedEdges(neighbour.id).filter(edge_id => current_edges.includes(edge_id));
            if (common_edges.length>=2){
              //Apply Hopf
              edges.remove({id:common_edges[0]});
              edges.remove({id:common_edges[1]});
              setTimeout(() => { HopfAll(true); }, 1);
              return true;
            }
          }
          if (neighbour.group==="H"){
            var hneighbour = nodes.get(network.getConnectedNodes(neighbour.id).filter(node_id => node_id!==current_node.id)[0]);
            if (hneighbour.group===current_node.group){
              var common_Hs = network.getConnectedNodes(hneighbour.id).filter(node_id => neighbours.includes(node_id));
              common_Hs = common_Hs.map(node_id => nodes.get(node_id)).filter(n => n.group==="H");
              if (common_Hs.length>=2){
                removeNode(common_Hs[0].id);
                removeNode(common_Hs[1].id);
                setTimeout(() => { HopfAll(true); }, 1);
                return true;
              }
            }
          }
        }
      }
    } 
    return b;
  }

  $('#HopfButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    return HopfAll();
  });

  function HInvAll(b) {
    if (b===undefined){ b = false; }
    for (current_node of nodes.get()){
      if (current_node.group==="H"){
        var neighbours = network.getConnectedNodes(current_node.id);
        for (neighbour of neighbours){
          neighbour = nodes.get(neighbour);
          if (neighbour.group==="H"){
            applyHInvolution(current_node, neighbour);
            setTimeout(() => { HInvAll(true); }, 1);
            return true;
          }
        }
      }
    }
    return b;
  }

  $('#HInvolutionButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    return HInvAll();
  });

  function CopyAll(b) {
    if (b===undefined){ b = false; }
    for (current_node of nodes.get()){
      if (network.getConnectedEdges(current_node.id).length===1 && ["Z","X"].includes(current_node.group)){
        var neighbour = nodes.get(network.getConnectedNodes(current_node.id)[0]);
        if (neighbour.group==="H"){
          applyColourChange(current_node, neighbour);
          setTimeout(() => { CopyAll(true); }, 1);
          return true;
        }
        if (neighbour.group==={"X":"Z", "Z":"X"}[current_node.group]){
          if (["π/2", "3π/2"].includes(current_node.label)){
            applyHRecomp(current_node);
            setTimeout(() => { CopyAll(true); }, 1);
            return true;
          }
          if (["", "π"].includes(current_node.label)){
            applyZXCopy(current_node,neighbour);
            setTimeout(() => { CopyAll(true); }, 1);
            return true;
          }
        }
      }
    }
    return b;
  }

  $('#CopyButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    return CopyAll();
  });

  var lock = false;

  const AllSimps = async() => {
    if (lock){
      setTimeout(() => { AllSimps(); }, 200);
      return;
    }
    lock = true;
    setTimeout(() => { SpiderAllH(); }, 1);
    var b = await HInvAll();
    if (b) { lock = false; await AllSimps(); return ;}
    b = await HopfAll();
    if (b) { lock = false; await AllSimps(); return ;}
    b = await CopyAll();
    if (b) { lock = false; await AllSimps(); return ;}
    lock = false;
  }

  $('#AllSimpsButton'+div_id).on('click', function(){
    $('#SimpModal'+div_id).modal('hide');
    return AllSimps();
  });

  // Predefined vis-network options for ZX-diagrams
  var options = {
      edges:{
        color: "black",
      },
      groups: {
        Z: {
          borderWidth: 1,
          borderWidthSelected: 2,
          shape: "circle",
          color: {
            background:"green", border:"black",
            highlight: {
              border: "black",
              background: "green"
            },
          },
        },
        X: {
          borderWidth: 1,
          borderWidthSelected: 2,
          shape: "circle",
          color: {
            background:"red", border:"black",
            highlight: {
              border: "black",
              background: "red"
            },
          },
        },
        H: {
          borderWidth: 1,
          borderWidthSelected: 2,
          shape: "box",
          color: {
            background:"yellow", border:"black",
            highlight: {
              border: "black",
              background: "yellow"
            },
          },
        },
        /*b: {
          shape: "circle",
          color: "black",
          margin: 0.1,
        },*/
        b: {
          shape:"image",
          size:5,
          image:"ressources/boundary.svg",
          //fixed:{y:true},
        },
        bang: {
          shape:"image",
          size:15,
          image:{ selected:"ressources/discard-circle-2-selected.svg", unselected:"ressources/discard-circle-2.svg"},
        },
        /*bang: {
          shape: "circle",
          color: "white",
          margin: 0.1,
        },*/
      },
      interaction: {
        dragView: false,
        multiselect: true,
        zoomView: (method!=="fit"),
      },
    };

  var container = document.getElementById(div_id);
  var network = new vis.Network(container, data, options);

  network.stopSimulation();
  /*network.redraw();
  network.startSimulation();*/

  if (method==="fit"){
    window.onresize = function() {network.fit();};
    //network.on("release", function () { network.fit({animation: {duration: 500}}); });
    network.on("stabilized", function () { network.fit({animation: {duration: 500}}); });
  }

  network.on("selectNode", function(params) { applyZXRule(params.nodes); });
  network.on("doubleClick", function(params) { applyDbClickZXRule(params); });

  var pos = network.getPosition(0);
  network.moveNode(0,pos.x,pos.y);
}