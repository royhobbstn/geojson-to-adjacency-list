// Full Credit: http://eloquentjavascript.net/1st_edition/appendix2.html

// TODO this can be improved:  https://stackoverflow.com/questions/17009056/how-to-implement-ologn-decrease-key-operation-for-min-heap-based-priority-queu
// either a supplementary structure, or by not using decrease-key at all (see additional answers to question above)

function BinaryHeap(){
  this.heap = [];
}

BinaryHeap.prototype = {

  length: function () {
    return this.heap.length;
  },

  push: function(element) {
    // Add the new element to the end of the array.
    this.heap.push(element);
    // Allow it to bubble up.
    this.bubbleUp(this.heap.length - 1);
  },

  pop: function() {
    // Store the first element so we can return it later.
    const result = this.heap[0];
    // Get the element at the end of the array.
    const end = this.heap.pop();
    // If there are any elements left, put the end element at the start, and let it sink down.
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return result;
  },

  peek: function() {
    // just take a peek
    return this.heap[0];
  },

  remove: function(key) {
    const length = this.heap.length;
    // To remove a value, we must search through the array to find it.
    for (let i = 0; i < length; i++) {
      if (this.heap[i].key !== key) {
        continue;
      }
      // When it is found, the process seen in 'pop' is repeated to fill up the hole.
      const end = this.heap.pop();
      // If the element we popped was the one we needed to remove, we're done.
      if (i === length - 1){
        break;
      }
      // Otherwise, we replace the removed element with the popped
      // one, and allow it to float up or sink down as appropriate.
      this.heap[i] = end;
      this.bubbleUp(i);
      this.sinkDown(i);
      break;
    }
  },

  decrease_key: function(key, value) {
    // TODO this is not technically "decrease" key.
    // Increase works too
    const length = this.heap.length;
    // To remove a value, we must search through the array to find it.
    for (let i = 0; i < length; i++) {
      if (this.heap[i].key !== key) {
        continue;
      }
      // When it is found, alter it
      this.heap[i].value = value;
      // Allow it to float up or sink down as appropriate.
      this.bubbleUp(i);
      this.sinkDown(i);
      break;
    }
  },

  bubbleUp: function(n) {
    // Fetch the element that has to be moved.
    const element = this.heap[n], score = element.value;
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.heap[parentN];
      // If the parent has a lesser score, things are in order and we are done.
      if (score >= parent.value){
        break;
      }

      // Otherwise, swap the parent with the current element and continue.
      this.heap[parentN] = element;
      this.heap[n] = parent;
      n = parentN;
    }
  },

  sinkDown: function(n) {
    // Look up the target element and its score.
    const length = this.heap.length;
    const element = this.heap[n];
    const elemScore = element.value;


    while(true) {
      // Compute the indices of the child elements.
      const child2N = (n + 1) * 2, child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      let swap = null;
      // If the first child exists (is inside the array)...
      let child1Score;
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = this.heap[child1N];
        child1Score = child1.value;
        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore){
          swap = child1N;
        }
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = this.heap[child2N];
        const child2Score = child2.value;
        if (child2Score < (swap == null ? elemScore : child1Score)){
          swap = child2N;
        }
      }

      // No need to swap further, we are done.
      if (swap == null) break;

      // Otherwise, swap and continue.
      this.heap[n] = this.heap[swap];
      this.heap[swap] = element;
      n = swap;
    }
  }
};

exports.BinaryHeap = BinaryHeap;