import os
import re
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

# Pre-compiled high-quality pedagogical blueprints for popular subjects
CURRICULUM_BLUEPRINTS: Dict[str, Dict[str, Any]] = {
    "dsa": {
        "title": "Data Structures & Algorithms",
        "description": "Comprehensive roadmap covering arrays, pointer manipulation, non-linear structures, and algorithmic paradigms.",
        "milestones": [
            {
                "title": "Arrays, Two-Pointers & Sliding Window",
                "description": "Master continuous memory arrays, prefix sums, binary search variants, and two-pointer patterns.",
                "hours": 6.0,
                "subtopics": [
                    "Array memory allocation & amortized O(1) operations",
                    "Two-pointer technique for sorted arrays & pair sums",
                    "Sliding window pattern for contiguous subarray problems",
                    "Prefix sum arrays for range query optimization",
                    "Binary Search and modified boundary search patterns"
                ],
                "resources": [
                    {
                        "title": "Abdul Bari - Array Data Structure & Algorithms",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O",
                        "estimated_minutes": 45,
                        "summary": "Clear algorithmic intuition for memory layout, pointer operations, and time complexities."
                    },
                    {
                        "title": "NeetCode - Two Pointer & Sliding Window Patterns",
                        "resource_type": "article",
                        "url": "https://neetcode.io/practice",
                        "estimated_minutes": 30,
                        "summary": "Visual pattern diagrams and code walkthroughs for contiguous subarray algorithms."
                    },
                    {
                        "title": "LeetCode 150 Core Practice: Two Sum & Container With Most Water",
                        "resource_type": "practice",
                        "url": "https://leetcode.com/problemset/all/",
                        "estimated_minutes": 60,
                        "summary": "Hands-on implementation of the optimal two-pointer and hash map techniques."
                    },
                    {
                        "title": "Big-O Algorithmic Complexity Cheatsheet",
                        "resource_type": "cheatsheet",
                        "url": "https://www.bigocheatsheet.com/",
                        "estimated_minutes": 15,
                        "summary": "Quick reference table comparing best, average, and worst-case time/space bounds."
                    }
                ]
            },
            {
                "title": "Linked Lists, Stacks & Queues",
                "description": "Pointer manipulation, cycle detection, stack evaluation, and monotonic stack patterns.",
                "hours": 5.5,
                "subtopics": [
                    "Singly and doubly linked lists node pointer operations",
                    "Floyd's Tortoise & Hare algorithm for cycle detection",
                    "In-place iterative & recursive linked list reversal",
                    "Monotonic stacks for next greater element problems",
                    "Queue implementation via circular arrays & dual stacks"
                ],
                "resources": [
                    {
                        "title": "Harvard CS50 - Memory, Pointers and Linked Lists",
                        "resource_type": "video",
                        "url": "https://cs50.harvard.edu/",
                        "estimated_minutes": 50,
                        "summary": "Low-level memory pointers, node allocations, and pointer arithmetic demystified."
                    },
                    {
                        "title": "GeeksforGeeks - Fast and Slow Pointer Patterns",
                        "resource_type": "article",
                        "url": "https://www.geeksforgeeks.org/how-does-floyds-slow-and-fast-pointers-approach-work/",
                        "estimated_minutes": 25,
                        "summary": "Proof and implementation of cycle detection with O(1) auxiliary space."
                    },
                    {
                        "title": "Practice: Valid Parentheses & Reverse Linked List",
                        "resource_type": "practice",
                        "url": "https://leetcode.com/problems/reverse-linked-list/",
                        "estimated_minutes": 45,
                        "summary": "Core coding exercises reinforcing stack LIFO rules and pointer swapping."
                    }
                ]
            },
            {
                "title": "Trees, BST & Recursion Traversal",
                "description": "Tree representations, depth-first traversals, BST invariant validation, and Lowest Common Ancestor.",
                "hours": 7.0,
                "subtopics": [
                    "Binary tree recursive vs iterative traversals (In-order, Pre-order, Post-order)",
                    "Binary Search Tree properties, insertion, deletion & validation",
                    "Breadth-First Search (Level Order) using Queues",
                    "Lowest Common Ancestor (LCA) in binary trees",
                    "Balanced trees concept (AVL, Red-Black Trees)"
                ],
                "resources": [
                    {
                        "title": "freeCodeCamp - Tree Data Structure Full Course",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=fAAZixBzIAI",
                        "estimated_minutes": 60,
                        "summary": "Full visual tutorial on binary trees, BST operations, and traversal recursive frames."
                    },
                    {
                        "title": "Visualgo - Interactive Binary Search Tree Visualizer",
                        "resource_type": "article",
                        "url": "https://visualgo.net/en/bst",
                        "estimated_minutes": 20,
                        "summary": "Interactive visual animations showing step-by-step BST node insertion and balancing."
                    },
                    {
                        "title": "Tree Traversals & Recursion Cheatsheet",
                        "resource_type": "cheatsheet",
                        "url": "https://cipherium.ai/cheatsheets/bst-traversals",
                        "estimated_minutes": 15,
                        "summary": "Quick code templates for recursion base cases and DFS stack frames."
                    }
                ]
            },
            {
                "title": "Graphs, Shortest Paths & Dynamic Programming",
                "description": "Graph traversals, Dijkstra algorithm, topological sorting, and dynamic programming memoization.",
                "hours": 8.0,
                "subtopics": [
                    "Adjacency list vs matrix representations",
                    "Breadth-First Search (BFS) for shortest path in unweighted graphs",
                    "Depth-First Search (DFS) for cycle detection & topological sort",
                    "Dijkstra's Single-Source Shortest Path algorithm",
                    "Dynamic Programming: 1D memoization & 2D grid path formulation"
                ],
                "resources": [
                    {
                        "title": "MIT 6.006 - Introduction to Algorithms (Graph Search)",
                        "resource_type": "video",
                        "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
                        "estimated_minutes": 55,
                        "summary": "Rigorous academic lecture breaking down BFS, DFS, and edge relaxation theorems."
                    },
                    {
                        "title": "GeeksforGeeks - Graph Algorithms Guide",
                        "resource_type": "article",
                        "url": "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/",
                        "estimated_minutes": 30,
                        "summary": "In-depth guide covering connected components, bipartite checks, and Dijkstra priority queues."
                    },
                    {
                        "title": "LeetCode: Number of Islands & Course Schedule",
                        "resource_type": "practice",
                        "url": "https://leetcode.com/problems/number-of-islands/",
                        "estimated_minutes": 60,
                        "summary": "Benchmark graph problems frequently asked in technical interviews."
                    }
                ]
            }
        ]
    },
    "os": {
        "title": "Operating Systems & Concurrency",
        "description": "Processes, threads, CPU scheduling, synchronization primitives, memory virtualization, and file systems.",
        "milestones": [
            {
                "title": "Process Lifecycle, System Calls & Concurrency",
                "description": "Understand kernel mode vs user mode, process state transitions, PCB, and fork() system call semantics.",
                "hours": 5.0,
                "subtopics": [
                    "Kernel mode vs user mode and dual-mode operation",
                    "Process Control Block (PCB) & context switching overhead",
                    "Fork, Exec, Wait, and Exit lifecycle mechanisms",
                    "Threads vs Processes and thread memory layout",
                    "Inter-Process Communication (IPC): Pipes, Shared Memory, Message Queues"
                ],
                "resources": [
                    {
                        "title": "Gate Smashers - Process State Transitions & PCB",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
                        "estimated_minutes": 35,
                        "summary": "Crystal-clear breakdown of how kernels switch tasks and preserve CPU registers."
                    },
                    {
                        "title": "Operating Systems: Three Easy Pieces (OSTEP) - Processes",
                        "resource_type": "article",
                        "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf",
                        "estimated_minutes": 30,
                        "summary": "The gold-standard textbook chapter introducing CPU virtualization and time sharing."
                    },
                    {
                        "title": "POSIX System Calls Reference Cheatsheet",
                        "resource_type": "cheatsheet",
                        "url": "https://www.geeksforgeeks.org/operating-systems/",
                        "estimated_minutes": 15,
                        "summary": "Quick lookup table for fork, waitpid, pipe, and signal numbers."
                    }
                ]
            },
            {
                "title": "CPU Scheduling & Synchronization (Semaphores & Deadlocks)",
                "description": "Scheduling policies, race conditions, critical section problem, mutex locks, and deadlock handling.",
                "hours": 6.5,
                "subtopics": [
                    "Preemptive vs non-preemptive scheduling (FCFS, SJF, Round Robin)",
                    "Multi-level Feedback Queue (MLFQ) design",
                    "Critical section problem & Peterson's solution",
                    "Mutexes vs Counting Semaphores vs Condition Variables",
                    "Deadlock conditions (Coffman) & Banker's avoidance algorithm"
                ],
                "resources": [
                    {
                        "title": "MIT 6.828 - Concurrency, Mutexes & Locks",
                        "resource_type": "video",
                        "url": "https://pdos.csail.mit.edu/6.828/",
                        "estimated_minutes": 45,
                        "summary": "Engineering real concurrency in modern operating system kernels."
                    },
                    {
                        "title": "GeeksforGeeks - Banker's Algorithm & Deadlock Avoidance",
                        "resource_type": "article",
                        "url": "https://www.geeksforgeeks.org/bankers-algorithm-in-operating-system-2/",
                        "estimated_minutes": 25,
                        "summary": "Mathematical safety state verification and resource request matrices."
                    },
                    {
                        "title": "Practice: Classical Producer-Consumer Problem Simulation",
                        "resource_type": "practice",
                        "url": "https://www.geeksforgeeks.org/producer-consumer-problem-using-semaphores-set-1/",
                        "estimated_minutes": 40,
                        "summary": "Hands-on implementation of synchronized buffer handling using semaphores."
                    }
                ]
            },
            {
                "title": "Virtual Memory, Paging & Page Replacement",
                "description": "Logical to physical address translation, Page Tables, TLB, Page Faults, and Replacement Algorithms.",
                "hours": 6.0,
                "subtopics": [
                    "Address translation: Page Numbers and Offsets",
                    "Multi-level page tables & Translation Lookaside Buffers (TLB)",
                    "Page fault handling interrupt sequence",
                    "Page replacement algorithms: FIFO, LRU, Second-Chance, Optimal",
                    "Thrashing causes and working-set models"
                ],
                "resources": [
                    {
                        "title": "Computerphile - Virtual Memory & Page Tables",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=qcBIvHMz45o",
                        "estimated_minutes": 25,
                        "summary": "Clear, accessible visual walkthrough of how hardware MMU maps addresses."
                    },
                    {
                        "title": "OSTEP - Paging & Virtual Memory Architecture",
                        "resource_type": "article",
                        "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
                        "estimated_minutes": 35,
                        "summary": "Detailed exploration of space and time trade-offs in modern memory architectures."
                    },
                    {
                        "title": "Page Replacement Algorithms Comparison Matrix",
                        "resource_type": "cheatsheet",
                        "url": "https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/",
                        "estimated_minutes": 15,
                        "summary": "Comparison of Belady's Anomaly, hit rates, and stack algorithms."
                    }
                ]
            },
            {
                "title": "File Systems, I/O Subsystems & Disk Scheduling",
                "description": "Inode structure, directories, file allocation tables, journaling, and disk arm scheduling.",
                "hours": 5.0,
                "subtopics": [
                    "Inodes, superblock, and directory mapping structures",
                    "Contiguous, linked, and indexed file allocation",
                    "Crash consistency & Write-Ahead Logging (Journaling)",
                    "Disk scheduling algorithms (SSTF, SCAN, C-SCAN)",
                    "Device drivers, interrupts, and DMA controllers"
                ],
                "resources": [
                    {
                        "title": "OSTEP - Fast File System & Inode Walkthrough",
                        "resource_type": "article",
                        "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf",
                        "estimated_minutes": 30,
                        "summary": "How disks translate block requests into file access hierarchies."
                    },
                    {
                        "title": "Disk Scheduling Algorithms Visualized",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=example_disk",
                        "estimated_minutes": 25,
                        "summary": "Step-by-step seek-time optimization diagrams."
                    }
                ]
            }
        ]
    },
    "networks": {
        "title": "Computer Networks & Protocol Engineering",
        "description": "Layered protocol stack, TCP reliable transport, IP routing, DNS resolution, and TLS cryptography.",
        "milestones": [
            {
                "title": "Layered Architecture, Physical & Data Link Layer",
                "description": "OSI vs TCP/IP models, framing, MAC addressing, CSMA/CD, and Ethernet switching.",
                "hours": 4.5,
                "subtopics": [
                    "OSI 7-Layer model vs TCP/IP 4-Layer architectural trade-offs",
                    "Encapsulation, de-encapsulation, and packet headers",
                    "MAC addressing vs IP addressing",
                    "Address Resolution Protocol (ARP) workflow",
                    "Switching vs Routing differences"
                ],
                "resources": [
                    {
                        "title": "Kurose & Ross - Computer Networking: A Top-Down Approach Overview",
                        "resource_type": "article",
                        "url": "https://gaia.cs.umass.edu/kurose_ross/",
                        "estimated_minutes": 35,
                        "summary": "Authoritative guide on protocol layer abstraction and network boundaries."
                    },
                    {
                        "title": "NetworkChuck - What is OSI Model?",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=LANW3m7UgWs",
                        "estimated_minutes": 25,
                        "summary": "Energetic, practical breakdown of each layer in real internet communication."
                    }
                ]
            },
            {
                "title": "Transport Layer: TCP, UDP & Flow Control",
                "description": "Reliable connection-oriented TCP vs lightweight UDP, 3-way handshake, sliding window, and congestion control.",
                "hours": 6.0,
                "subtopics": [
                    "Port multiplexing and socket communication",
                    "TCP 3-Way Handshake and 4-Way Connection Teardown",
                    "TCP Sequence numbers, ACKs, and Selective Acknowledgment (SACK)",
                    "Flow control via Receive Window (rwnd)",
                    "TCP Congestion control: Slow Start, Congestion Avoidance, Fast Retransmit (cwnd)"
                ],
                "resources": [
                    {
                        "title": "Computerphile - How TCP Works",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=PpsEaqJV_A0",
                        "estimated_minutes": 20,
                        "summary": "Intuitive breakdown of packets, retransmissions, and flow regulation."
                    },
                    {
                        "title": "GeeksforGeeks - TCP 3-Way Handshake In Detail",
                        "resource_type": "article",
                        "url": "https://www.geeksforgeeks.org/tcp-3-way-handshake-process/",
                        "estimated_minutes": 25,
                        "summary": "Deep dive into SYN, SYN-ACK, ACK packet flags, sequence numbers, and reset states."
                    }
                ]
            },
            {
                "title": "Network Layer: IPv4, IPv6, Subnetting & Routing Protocols",
                "description": "IP addressing, CIDR prefixes, NAT traversal, and interior/exterior routing algorithms (OSPF, BGP).",
                "hours": 6.5,
                "subtopics": [
                    "IPv4 packet structure & TTL decrementing",
                    "Subnetting & CIDR notation calculations",
                    "Network Address Translation (NAT) and private IP ranges",
                    "Link-State (OSPF / Dijkstra) vs Distance-Vector (RIP / Bellman-Ford)",
                    "Border Gateway Protocol (BGP) internet autonomous systems"
                ],
                "resources": [
                    {
                        "title": "Subnetting Mastery - Practical CIDR Calculations",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=s_Ntt6eTn94",
                        "estimated_minutes": 40,
                        "summary": "Step-by-step mental math methods for calculating network, broadcast, and host ranges."
                    },
                    {
                        "title": "CIDR Subnetting Cheat Sheet",
                        "resource_type": "cheatsheet",
                        "url": "https://www.calculator.net/ip-subnet-calculator.html",
                        "estimated_minutes": 15,
                        "summary": "Reference table for prefix lengths /24 to /32 and available usable IPs."
                    }
                ]
            },
            {
                "title": "Application Layer: HTTP/2/3, DNS & TLS Security",
                "description": "DNS hierarchy, HTTP status codes, persistent connections, multiplexing, and TLS handshake cryptography.",
                "hours": 5.0,
                "subtopics": [
                    "DNS hierarchical resolution: Root, TLD, and Authoritative servers",
                    "HTTP/1.1 vs HTTP/2 (multiplexing) vs HTTP/3 (QUIC/UDP)",
                    "TLS/SSL cryptographic handshake: Public key exchange & session keys",
                    "WebSockets vs Long Polling vs Server-Sent Events (SSE)",
                    "Cookies, Sessions, and JWT stateless tokens"
                ],
                "resources": [
                    {
                        "title": "ByteByteGo - How Does DNS Work?",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=27r4Bzuj5OI",
                        "estimated_minutes": 15,
                        "summary": "Top-tier animated explainer on recursive resolvers and DNS caching."
                    },
                    {
                        "title": "MDN Web Docs - HTTP Protocols Evolution",
                        "resource_type": "article",
                        "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
                        "estimated_minutes": 30,
                        "summary": "Complete developer reference on request headers, idempotency, and status codes."
                    }
                ]
            }
        ]
    },
    "dbms": {
        "title": "Database Management Systems (DBMS & SQL)",
        "description": "Relational data modeling, normal forms, B-Tree and hash indexing, transaction isolation, and query plans.",
        "milestones": [
            {
                "title": "Relational Modeling, Schema Design & Normalization",
                "description": "Entity-Relationship models, relational schema translation, keys, and 1NF through BCNF decomposition.",
                "hours": 5.0,
                "subtopics": [
                    "Primary, Candidate, Super, Foreign, and Surrogate keys",
                    "Functional dependencies and attribute closure calculation",
                    "First, Second, and Third Normal Forms (1NF, 2NF, 3NF)",
                    "Boyce-Codd Normal Form (BCNF) decomposition without data loss",
                    "Denormalization trade-offs for analytical read performance"
                ],
                "resources": [
                    {
                        "title": "Gate Smashers - Normalization 1NF to BCNF",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8C9azpbDu3NusUCRk",
                        "estimated_minutes": 40,
                        "summary": "Clear, worked-out examples testing functional dependencies and lossless joins."
                    },
                    {
                        "title": "Relational Schema Design Best Practices",
                        "resource_type": "article",
                        "url": "https://www.geeksforgeeks.org/introduction-of-database-normalization/",
                        "estimated_minutes": 25,
                        "summary": "Comprehensive architectural guide to reducing insert, update, and delete anomalies."
                    }
                ]
            },
            {
                "title": "Advanced SQL: Joins, Window Functions & CTEs",
                "description": "Master complex query logic, analytical windowing, recursive CTEs, and aggregation pipelines.",
                "hours": 6.0,
                "subtopics": [
                    "Inner, Left, Right, Full Outer, and Cross Joins semantics",
                    "Window functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE()",
                    "Partitioning and Order By inside OVER() clauses",
                    "Common Table Expressions (CTEs) & Recursive queries",
                    "Subqueries vs Correlated Subqueries performance"
                ],
                "resources": [
                    {
                        "title": "Mode Analytics - Interactive Advanced SQL Tutorial",
                        "resource_type": "article",
                        "url": "https://mode.com/sql-tutorial/",
                        "estimated_minutes": 45,
                        "summary": "Hands-on browser queries practicing window functions and complex joins."
                    },
                    {
                        "title": "SQL Window Functions Cheatsheet",
                        "resource_type": "cheatsheet",
                        "url": "https://learnsql.com/blog/sql-window-functions-cheat-sheet/",
                        "estimated_minutes": 15,
                        "summary": "Visual syntax diagrams for framing (ROWS BETWEEN) and ranking functions."
                    }
                ]
            },
            {
                "title": "Indexing, B-Trees & Query Optimization",
                "description": "Storage engine structures, clustered vs non-clustered indexes, execution plans, and scan types.",
                "hours": 6.5,
                "subtopics": [
                    "B+ Tree index mechanics and node split/merge algorithms",
                    "Clustered vs Secondary (Non-Clustered) indexes",
                    "Composite indexes and the Leftmost Prefix rule",
                    "EXPLAIN ANALYZE: Sequential scan, Index Scan, and Bitmap Scan",
                    "Covering indexes and eliminating table lookups"
                ],
                "resources": [
                    {
                        "title": "Use The Index, Luke! - A Guide to Database Performance",
                        "resource_type": "article",
                        "url": "https://use-the-index-luke.com/",
                        "estimated_minutes": 45,
                        "summary": "The premier guide explaining how developers must structure indexes for query planners."
                    },
                    {
                        "title": "Hussein Nasser - Database Indexing Explained Deep Dive",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=-qNSXK7s7_w",
                        "estimated_minutes": 35,
                        "summary": "Under-the-hood look at how disk pages, leaf nodes, and buffer pools interact."
                    }
                ]
            },
            {
                "title": "Transactions, ACID & Concurrency Control",
                "description": "Atomicity, Consistency, Isolation, Durability, isolation anomalies, locks, and MVCC.",
                "hours": 5.5,
                "subtopics": [
                    "ACID properties and Write-Ahead Logging (WAL)",
                    "Read Phenomena: Dirty Read, Non-Repeatable Read, Phantom Read",
                    "Transaction Isolation Levels: Read Uncommitted to Serializable",
                    "Two-Phase Locking (2PL) and Deadlock detection",
                    "Multi-Version Concurrency Control (MVCC) in PostgreSQL/MySQL"
                ],
                "resources": [
                    {
                        "title": "Carnegie Mellon 15-445 - Concurrency Control & ACID",
                        "resource_type": "video",
                        "url": "https://15445.courses.cs.cmu.edu/",
                        "estimated_minutes": 50,
                        "summary": "World-class database systems lecture from Prof. Andy Pavlo at CMU."
                    },
                    {
                        "title": "PostgreSQL Isolation Levels & MVCC Architecture",
                        "resource_type": "article",
                        "url": "https://www.postgresql.org/docs/current/transaction-iso.html",
                        "estimated_minutes": 30,
                        "summary": "Official documentation describing snapshot isolation and tuple visibility rules."
                    }
                ]
            }
        ]
    },
    "ml": {
        "title": "Machine Learning & Applied AI",
        "description": "Mathematical foundations, supervised models, loss functions, regularization, deep networks, and evaluation metrics.",
        "milestones": [
            {
                "title": "Foundations: Data Preprocessing, LinAlg & Feature Engineering",
                "description": "Vectors, matrices, gradient descent, train/test splitting, normalization, and handling missing data.",
                "hours": 5.0,
                "subtopics": [
                    "NumPy vectorization & Pandas exploratory data analysis (EDA)",
                    "Feature scaling: Standardization (Z-score) vs Min-Max Normalization",
                    "Cost functions: Mean Squared Error (MSE) and Cross-Entropy loss",
                    "Batch, Stochastic, and Mini-batch Gradient Descent algorithms",
                    "Bias-Variance trade-off intuition"
                ],
                "resources": [
                    {
                        "title": "3Blue1Brown - Essence of Linear Algebra",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
                        "estimated_minutes": 45,
                        "summary": "Legendary visual animations providing geometric intuition for dot products and transformations."
                    },
                    {
                        "title": "Scikit-Learn - Feature Scaling and Preprocessing Guide",
                        "resource_type": "article",
                        "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
                        "estimated_minutes": 30,
                        "summary": "Official guide with practical code snippets for pipeline transformers."
                    }
                ]
            },
            {
                "title": "Supervised Learning: Regression & Regularization",
                "description": "Linear and Polynomial regression, Ordinary Least Squares, L1 Lasso, and L2 Ridge regularization.",
                "hours": 6.0,
                "subtopics": [
                    "Linear regression hypothesis formulation & closed-form Normal Equation",
                    "L1 Regularization (Lasso) for automatic feature sparsity",
                    "L2 Regularization (Ridge) for handling multicollinearity",
                    "ElasticNet hybrid formulation",
                    "Polynomial features and overfitting prevention"
                ],
                "resources": [
                    {
                        "title": "StatQuest - Ridge, Lasso and ElasticNet Regression",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=Q81RR3yKn30",
                        "estimated_minutes": 30,
                        "summary": "Josh Starmer's delightfully simple explanation of penalty terms and geometric shrinkage."
                    },
                    {
                        "title": "Hands-on ML with Scikit-Learn - Linear Models Chapter",
                        "resource_type": "article",
                        "url": "https://github.com/ageron/handson-ml3",
                        "estimated_minutes": 40,
                        "summary": "Practical Jupyter notebooks demonstrating model training and hyperparameter tuning."
                    }
                ]
            },
            {
                "title": "Classification Algorithms & Model Evaluation",
                "description": "Logistic regression, Decision Trees, Random Forests, Confusion Matrix, ROC-AUC, and F1-Score.",
                "hours": 7.0,
                "subtopics": [
                    "Sigmoid activation and log-odds in Logistic Regression",
                    "Decision Trees: Gini impurity and Information Gain (Entropy)",
                    "Ensemble methods: Random Forest Bagging vs Gradient Boosting (XGBoost)",
                    "Evaluation metrics: Precision, Recall, F1-Score for imbalanced datasets",
                    "Receiver Operating Characteristic (ROC) curve and Area Under Curve (AUC)"
                ],
                "resources": [
                    {
                        "title": "StatQuest - ROC and AUC Clearly Explained",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=4jRBRDbJemM",
                        "estimated_minutes": 25,
                        "summary": "Step-by-step threshold adjustments mapping true positive vs false positive rates."
                    },
                    {
                        "title": "Machine Learning Evaluation Metrics Cheatsheet",
                        "resource_type": "cheatsheet",
                        "url": "https://scikit-learn.org/stable/modules/model_evaluation.html",
                        "estimated_minutes": 15,
                        "summary": "Quick formulas for precision, recall, specificity, and macro vs micro averages."
                    }
                ]
            },
            {
                "title": "Neural Networks & Deep Learning Intro",
                "description": "Perceptrons, multi-layer architectures, backpropagation calculus, and activation functions.",
                "hours": 7.0,
                "subtopics": [
                    "Single neuron perceptron vs Multi-Layer Perceptron (MLP)",
                    "Activation functions: ReLU, Leaky ReLU, Sigmoid, Softmax",
                    "Backpropagation & chain rule derivative computations",
                    "Optimizers: Momentum, RMSProp, and Adam",
                    "Overfitting prevention: Dropout and Early Stopping"
                ],
                "resources": [
                    {
                        "title": "3Blue1Brown - But what is a neural network? (Chapter 1)",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=aircAruvnKk",
                        "estimated_minutes": 20,
                        "summary": "Stunning visualization of weight matrices and neuron activations."
                    },
                    {
                        "title": "PyTorch 60-Minute Blitz",
                        "resource_type": "practice",
                        "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
                        "estimated_minutes": 60,
                        "summary": "Official interactive tutorial creating your first neural network tensor graph."
                    }
                ]
            }
        ]
    },
    "webdev": {
        "title": "Full-Stack Web Development",
        "description": "Modern frontend React, backend API architectures, authentication, and state management.",
        "milestones": [
            {
                "title": "Core Modern JavaScript & TypeScript",
                "description": "ES6+ semantics, asynchronous event loop, promises, DOM manipulation, and TypeScript typing.",
                "hours": 5.0,
                "subtopics": [
                    "Variables, scope (let/const vs var), and hoisting",
                    "Arrow functions, destructuring, and spread/rest operators",
                    "Asynchronous JavaScript: Event Loop, Microtasks, Promises, Async/Await",
                    "TypeScript interfaces, types, generics, and compile-time safety",
                    "Fetch API and handling HTTP headers & JSON payloads"
                ],
                "resources": [
                    {
                        "title": "JavaScript.info - The Modern JavaScript Tutorial",
                        "resource_type": "article",
                        "url": "https://javascript.info/",
                        "estimated_minutes": 45,
                        "summary": "The premier comprehensive web reference from fundamentals to advanced event loops."
                    },
                    {
                        "title": "Fireship - JavaScript in 100 Seconds & Async Explained",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=vn3tm0quoqE",
                        "estimated_minutes": 20,
                        "summary": "Fast-paced visual explainer on how single-threaded event loops handle async tasks."
                    }
                ]
            },
            {
                "title": "React Architecture, Hooks & Component Design",
                "description": "JSX, state, props, useEffect dependency arrays, custom hooks, and component hierarchy.",
                "hours": 6.5,
                "subtopics": [
                    "Virtual DOM, reconciliation, and unidirectional data flow",
                    "useState and useReducer for local component state",
                    "useEffect rules, dependency arrays, and cleanup functions",
                    "useMemo and useCallback performance optimizations",
                    "Building reusable UI components and modular layouts"
                ],
                "resources": [
                    {
                        "title": "React Official Docs - Thinking in React",
                        "resource_type": "article",
                        "url": "https://react.dev/learn/thinking-in-react",
                        "estimated_minutes": 35,
                        "summary": "The official framework guide on structuring component hierarchies and state placement."
                    },
                    {
                        "title": "Web Dev Simplified - React Hooks Explained in Depth",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/playlist?list=PLZlA0Gpn_vH8EtggFGERCwMY56Jr98OXh",
                        "estimated_minutes": 40,
                        "summary": "Clear, practical examples showing exact pitfall cases with useEffect and dependencies."
                    }
                ]
            },
            {
                "title": "Backend API Development: FastAPI / Express & REST",
                "description": "Routing, middleware, request validation, database ORM integration, and error handling.",
                "hours": 6.0,
                "subtopics": [
                    "RESTful architectural principles and idempotent HTTP verbs",
                    "FastAPI dependency injection and Pydantic schema validation",
                    "SQLAlchemy ORM models, migrations, and relationship joins",
                    "Error handling middleware and standardized response payloads",
                    "CORS configuration and security headers"
                ],
                "resources": [
                    {
                        "title": "FastAPI Official Tutorial - User Guide",
                        "resource_type": "article",
                        "url": "https://fastapi.tiangolo.com/tutorial/",
                        "estimated_minutes": 40,
                        "summary": "High-performance Python API design with automatic OpenAPI / Swagger documentation."
                    },
                    {
                        "title": "FreeCodeCamp - Full Stack Development Walkthrough",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=7CqJlxBYj-M",
                        "estimated_minutes": 55,
                        "summary": "Complete project building frontend and backend API communication."
                    }
                ]
            },
            {
                "title": "Authentication, Deployment & State Management",
                "description": "JWT tokens, password hashing, global state stores, Docker containers, and cloud deployment.",
                "hours": 5.5,
                "subtopics": [
                    "JWT token signing, expiration, and secure HTTP-only cookies",
                    "Password hashing with bcrypt and salt rounds",
                    "Global state management (Context API, Redux Toolkit, or Zustand)",
                    "Containerization with Docker & docker-compose",
                    "Continuous Integration and deploying to Vercel/Render"
                ],
                "resources": [
                    {
                        "title": "Auth0 - Introduction to JSON Web Tokens (JWT)",
                        "resource_type": "article",
                        "url": "https://jwt.io/introduction",
                        "estimated_minutes": 25,
                        "summary": "Visual dissection of header, payload claims, and signature verification."
                    },
                    {
                        "title": "Docker Tutorial for Beginners",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo",
                        "estimated_minutes": 35,
                        "summary": "Containerizing full-stack web applications for reliable deployment."
                    }
                ]
            }
        ]
    },
    "systemdesign": {
        "title": "System Design & Distributed Systems",
        "description": "High-availability architectures, caching, load balancing, message queues, sharding, and real-world system design.",
        "milestones": [
            {
                "title": "Scalability Core & The CAP Theorem",
                "description": "Horizontal vs Vertical scaling, latency vs throughput, consistency models, and the CAP theorem.",
                "hours": 5.0,
                "subtopics": [
                    "Vertical vs Horizontal scaling trade-offs",
                    "Latency, throughput, and availability metrics (99.99% SLOs)",
                    "CAP theorem: Consistency, Availability, Partition Tolerance",
                    "BASE architecture and eventual consistency",
                    "Back-of-the-envelope capacity estimations"
                ],
                "resources": [
                    {
                        "title": "System Design Primer - Donne Martin",
                        "resource_type": "article",
                        "url": "https://github.com/donnemartin/system-design-primer",
                        "estimated_minutes": 60,
                        "summary": "The definitive open-source compendium for learning scalable distributed systems."
                    },
                    {
                        "title": "ByteByteGo - Scalability Fundamentals",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=m8Icp_Cid5o",
                        "estimated_minutes": 25,
                        "summary": "Crystal-clear animated walkthrough from a single server to millions of users."
                    }
                ]
            },
            {
                "title": "Caching, CDNs & Load Balancing",
                "description": "In-memory caching patterns (Redis/Memcached), eviction strategies, reverse proxies, and CDN caching.",
                "hours": 6.0,
                "subtopics": [
                    "Cache-Aside, Read-Through, Write-Through, and Write-Back policies",
                    "Cache Eviction: Least Recently Used (LRU) and LFU",
                    "Cache Stampede, Cache Penetration, and Cache Avalanche mitigations",
                    "Load balancing algorithms: Round Robin, Weighted, Least Connections",
                    "Content Delivery Networks (CDNs) and edge caching"
                ],
                "resources": [
                    {
                        "title": "Redis - In-Memory Caching Architecture Guide",
                        "resource_type": "article",
                        "url": "https://redis.io/docs/latest/develop/use/caching/",
                        "estimated_minutes": 30,
                        "summary": "How Redis operates as an in-memory sub-millisecond key-value cache."
                    },
                    {
                        "title": "ByteByteGo - Caching Strategies Visualized",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=dGAgxozNWFE",
                        "estimated_minutes": 20,
                        "summary": "Diagramming write-through vs cache-aside in high traffic environments."
                    }
                ]
            },
            {
                "title": "Databases Sharding, Replication & Message Queues",
                "description": "Relational vs NoSQL, master-replica replication, horizontal sharding keys, Kafka, and RabbitMQ.",
                "hours": 6.5,
                "subtopics": [
                    "Master-Slave (Leader-Follower) read-replica architectures",
                    "Database sharding by Range, Hash, and Directory mapping",
                    "Message Queues (Kafka / RabbitMQ) for asynchronous decoupling",
                    "Pub/Sub patterns and consumer group scaling",
                    "Distributed transactions: Two-Phase Commit (2PC) vs Saga pattern"
                ],
                "resources": [
                    {
                        "title": "Designing Data-Intensive Applications (DDIA) Overview",
                        "resource_type": "article",
                        "url": "https://dataintensive.net/",
                        "estimated_minutes": 45,
                        "summary": "Martin Kleppmann's masterwork on replication, partitioning, and consistency."
                    },
                    {
                        "title": "Hussein Nasser - Database Sharding Explained",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=5faMjKuB9bc",
                        "estimated_minutes": 30,
                        "summary": "Real-world walkthrough of partition keys and cross-shard queries."
                    }
                ]
            },
            {
                "title": "End-to-End System Design Case Studies",
                "description": "Designing high-scale systems: URL Shortener (TinyURL), Twitter Feed, and Video Streaming (YouTube/Netflix).",
                "hours": 6.5,
                "subtopics": [
                    "Designing a scalable URL Shortener (Base62 encoding, hash collisions)",
                    "Designing a Social Media News Feed (Fan-out on write vs fan-out on read)",
                    "Designing a Real-time Chat System (WebSockets, Redis Pub/Sub)",
                    "Rate Limiting algorithms (Token Bucket, Leaky Bucket)",
                    "System design interview communication framework"
                ],
                "resources": [
                    {
                        "title": "ByteByteGo - System Design Interview Case Studies",
                        "resource_type": "video",
                        "url": "https://www.youtube.com/watch?v=bUHFg8CZFCA",
                        "estimated_minutes": 40,
                        "summary": "Step-by-step interview walkthrough solving real production architecture questions."
                    },
                    {
                        "title": "Grokking the System Design Interview Patterns",
                        "resource_type": "article",
                        "url": "https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions",
                        "estimated_minutes": 45,
                        "summary": "Complete architectural blueprints and database schemas for classical questions."
                    }
                ]
            }
        ]
    }
}

def match_subject_blueprint(subject: str) -> Optional[Dict[str, Any]]:
    """Finds a matching curriculum blueprint from keywords using word-boundary matching."""
    clean = subject.strip().lower()

    def has_kw(patterns: List[str]) -> bool:
        for p in patterns:
            # Word boundary matching prevents 'os' matching 'aerospace' or 'graph' matching 'cryptography'
            if re.search(r'\b' + re.escape(p) + r'\b', clean):
                return True
        return False

    if has_kw(["dsa", "data structure", "data structures", "algorithm", "algorithms", "array", "arrays", "tree", "trees", "graph", "graphs", "leetcode"]):
        return CURRICULUM_BLUEPRINTS["dsa"]
    if has_kw(["os", "operating system", "operating systems", "concurrency", "thread", "threads", "virtual memory", "deadlock"]):
        return CURRICULUM_BLUEPRINTS["os"]
    if has_kw(["network", "networks", "networking", "tcp", "ip", "osi", "http", "routing", "socket", "sockets"]):
        return CURRICULUM_BLUEPRINTS["networks"]
    if has_kw(["dbms", "database", "databases", "sql", "relational", "postgres", "mysql"]):
        return CURRICULUM_BLUEPRINTS["dbms"]
    if has_kw(["machine learning", "ml", "ai", "deep learning", "data science", "regression", "neural network"]):
        return CURRICULUM_BLUEPRINTS["ml"]
    if has_kw(["web", "webdev", "full stack", "react", "frontend", "javascript", "backend", "fastapi"]):
        return CURRICULUM_BLUEPRINTS["webdev"]
    if has_kw(["system design", "distributed", "scalability", "microservice", "microservices", "cache"]):
        return CURRICULUM_BLUEPRINTS["systemdesign"]

    return None

def generate_ai_curriculum_fallback(
    subject: str,
    duration_weeks: int,
    target_hours_per_week: int,
    skill_level: str,
    learning_goal: str
) -> Dict[str, Any]:
    """
    Generates a dynamic, pedagogically structured curriculum for any custom topic.
    """
    stage_count = max(2, min(duration_weeks, 6))
    hours_per_stage = round((duration_weeks * target_hours_per_week) / stage_count, 1)
    
    milestones = []
    
    stage_titles = [
        f"Stage 1: Core Fundamentals & Theoretical Foundations of {subject}",
        f"Stage 2: Applied Techniques & Essential Patterns in {subject}",
        f"Stage 3: Advanced Architectures & Practical Implementation of {subject}",
        f"Stage 4: Problem Solving, Optimization & Real-World Mastery in {subject}"
    ]
    if stage_count > 4:
        stage_titles.append(f"Stage 5: Production Patterns & System Integration in {subject}")
        stage_titles.append(f"Stage 6: Capstone Project & Evaluation for {subject}")

    for idx in range(stage_count):
        s_title = stage_titles[idx] if idx < len(stage_titles) else f"Stage {idx + 1}: Deep Exploration of {subject}"
        m_id = f"m-{uuid.uuid4().hex[:8]}"
        
        # Subtopics tailored to stage
        if idx == 0:
            subs = [
                f"Core vocabulary, concepts, and mental models of {subject}",
                f"Historical context and primary architectural principles",
                f"Setting up developer tools, environment, and foundational resources",
                f"Analyzing fundamental time, space, and design trade-offs"
            ]
        elif idx == 1:
            subs = [
                f"Working with standard libraries and key patterns in {subject}",
                f"Structuring standard workflows and decomposing practical problems",
                f"Hands-on exercises and debugging common edge cases",
                f"Benchmarking performance and understanding memory/compute bottlenecks"
            ]
        elif idx == 2:
            subs = [
                f"Advanced algorithms, structures, and optimization paradigms",
                f"Security, concurrency, and reliability considerations in {subject}",
                f"Designing modular and maintainable architectures",
                f"Integrating best practice design principles into complex workflows"
            ]
        else:
            subs = [
                f"End-to-end practical project development and synthesis",
                f"Testing methodologies, unit verification, and performance profiling",
                f"Preparing for technical assessments and industry use-cases",
                f"Continuous revision and self-directed challenge problem sets"
            ]

        resources = [
            {
                "id": f"res-{uuid.uuid4().hex[:6]}",
                "title": f"Masterclass: Comprehensive Guide to {subject} (Part {idx + 1})",
                "resource_type": "video",
                "url": f"https://www.youtube.com/results?search_query={requests.utils.quote(subject + ' tutorial')}",
                "estimated_minutes": 45,
                "summary": f"In-depth visual walkthrough of {subject} concepts, architectures, and real examples.",
                "completed": False
            },
            {
                "id": f"res-{uuid.uuid4().hex[:6]}",
                "title": f"Official Reference & Documentation for {subject}",
                "resource_type": "article",
                "url": f"https://en.wikipedia.org/wiki/Special:Search?search={requests.utils.quote(subject)}",
                "estimated_minutes": 30,
                "summary": f"Foundational reference documentation and architectural principles for {subject}.",
                "completed": False
            },
            {
                "id": f"res-{uuid.uuid4().hex[:6]}",
                "title": f"Essential Cheatsheet & Key Takeaways: {subject}",
                "resource_type": "cheatsheet",
                "url": f"https://devhints.io/",
                "estimated_minutes": 15,
                "summary": f"Concise memory aids, syntax cheat sheets, and formula references.",
                "completed": False
            },
            {
                "id": f"res-{uuid.uuid4().hex[:6]}",
                "title": f"Hands-on Practice & Challenge Exercises in {subject}",
                "resource_type": "practice",
                "url": "https://github.com/topics/" + requests.utils.quote(subject.lower().replace(" ", "-")),
                "estimated_minutes": 60,
                "summary": f"Practical coding challenges and exercises to solidify hands-on confidence.",
                "completed": False
            }
        ]

        milestones.append({
            "id": m_id,
            "stage_number": idx + 1,
            "title": s_title,
            "description": f"Curriculum stage {idx + 1} dedicated to mastering key aspects of {subject} based on your {skill_level} level.",
            "estimated_hours": hours_per_stage,
            "subtopics": subs,
            "completed_subtopics": [],
            "resources": resources,
            "status": "in_progress" if idx == 0 else "pending"
        })

    return {
        "id": f"plan-{uuid.uuid4().hex[:10]}",
        "subject": subject,
        "skill_level": skill_level,
        "duration_weeks": duration_weeks,
        "target_hours_per_week": target_hours_per_week,
        "learning_goal": learning_goal,
        "total_estimated_hours": round(duration_weeks * target_hours_per_week, 1),
        "completed_hours": 0.0,
        "milestones": milestones,
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    }

GEMINI_PLAN_PROMPT = """You are an expert academic curriculum designer. Generate a detailed study plan roadmap as a valid JSON object for the subject: "{subject}".

Requirements:
- Skill Level: {skill_level}
- Duration: {duration_weeks} weeks  
- Hours per week: {target_hours_per_week}
- Goal: {learning_goal}
- Total hours budget: {total_hours}

Output ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "subject": "Full subject name",
  "milestones": [
    {{
      "title": "Week 1: Topic Name",
      "description": "2-3 sentence description of what this stage covers",
      "estimated_hours": 10.0,
      "subtopics": [
        "Specific concept or skill 1",
        "Specific concept or skill 2",
        "Specific concept or skill 3",
        "Specific concept or skill 4",
        "Specific concept or skill 5"
      ],
      "resources": [
        {{
          "title": "Descriptive resource title",
          "resource_type": "video",
          "url": "https://real-working-url.com/path",
          "estimated_minutes": 30,
          "summary": "What you will learn from this resource"
        }},
        {{
          "title": "Descriptive resource title",
          "resource_type": "article",
          "url": "https://real-working-url.com/path",
          "estimated_minutes": 20,
          "summary": "What you will learn from this resource"
        }},
        {{
          "title": "Descriptive resource title",
          "resource_type": "practice",
          "url": "https://real-working-url.com/path",
          "estimated_minutes": 45,
          "summary": "What you will practice here"
        }},
        {{
          "title": "Descriptive resource title",
          "resource_type": "cheatsheet",
          "url": "https://real-working-url.com/path",
          "estimated_minutes": 10,
          "summary": "Quick reference for this topic"
        }}
      ]
    }}
  ]
}}

CRITICAL RULES:
1. Use ONLY these resource_type values: "video", "article", "practice", "cheatsheet"
2. URLs must be real links from: YouTube, GeeksforGeeks (geeksforgeeks.org), LeetCode (leetcode.com), NeetCode (neetcode.io), freeCodeCamp (freecodecamp.org), MDN (developer.mozilla.org), W3Schools, Programiz, Visualgo (visualgo.net), CP-Algorithms (cp-algorithms.com), MIT OCW, Coursera, HackerRank, Codeforces, take U Forward (takeuforward.org), Striver A2Z sheet
3. Practice resources: LeetCode problem URLs, NeetCode, HackerRank
4. Video resources: YouTube with real video/playlist IDs when known
5. Articles: GeeksforGeeks, MDN, Programiz, W3Schools specific pages
6. Generate exactly {num_milestones} milestones
7. Output ONLY raw JSON - no markdown fences, no extra text
"""


def call_gemini_for_plan(subject: str, duration_weeks: int, target_hours_per_week: int,
                          skill_level: str, learning_goal: str) -> Optional[Dict[str, Any]]:
    """Calls Gemini API to generate a study plan. Returns parsed plan dict or None on failure."""
    api_key = GEMINI_API_KEY.strip()
    if not api_key or api_key in ("", "replace_with_your_key", "your_api_key_here"):
        return None

    total_hours = duration_weeks * target_hours_per_week
    num_milestones = min(max(duration_weeks, 2), 6)

    prompt = GEMINI_PLAN_PROMPT.format(
        subject=subject,
        skill_level=skill_level,
        duration_weeks=duration_weeks,
        target_hours_per_week=target_hours_per_week,
        learning_goal=learning_goal,
        total_hours=total_hours,
        num_milestones=num_milestones
    )

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.95,
                "maxOutputTokens": 8192,
            }
        }
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code != 200:
            print(f"[Gemini] HTTP {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

        # Strip markdown fences if present
        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            parts = raw_text.split("```")
            raw_text = parts[1] if len(parts) > 1 else raw_text
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip().rstrip("`").strip()

        plan_data = json.loads(raw_text)

        milestones_out = []
        hours_each = round(total_hours / max(len(plan_data.get("milestones", [])), 1), 1)

        for idx, m in enumerate(plan_data.get("milestones", [])):
            res_list = []
            for r in m.get("resources", []):
                r_type = r.get("resource_type", "article")
                if r_type not in ("video", "article", "practice", "cheatsheet"):
                    r_type = "article"
                res_list.append({
                    "id": f"res-{uuid.uuid4().hex[:6]}",
                    "title": r.get("title", "Resource"),
                    "resource_type": r_type,
                    "url": r.get("url", "#"),
                    "estimated_minutes": int(r.get("estimated_minutes", 20)),
                    "summary": r.get("summary", ""),
                    "completed": False
                })

            milestones_out.append({
                "id": f"m-{uuid.uuid4().hex[:8]}",
                "stage_number": idx + 1,
                "title": m.get("title", f"Stage {idx + 1}"),
                "description": m.get("description", ""),
                "estimated_hours": float(m.get("estimated_hours", hours_each)),
                "subtopics": m.get("subtopics", []),
                "completed_subtopics": [],
                "resources": res_list,
                "status": "in_progress" if idx == 0 else "pending"
            })

        return {
            "id": f"plan-{uuid.uuid4().hex[:10]}",
            "subject": plan_data.get("subject", subject),
            "skill_level": skill_level,
            "duration_weeks": duration_weeks,
            "target_hours_per_week": target_hours_per_week,
            "learning_goal": learning_goal,
            "total_estimated_hours": round(total_hours, 1),
            "completed_hours": 0.0,
            "milestones": milestones_out,
            "generated_by": "gemini",
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        }

    except Exception as e:
        print(f"[StudyPlanGenerator] Gemini error: {e}")
        return None


def generate_study_plan(
    subject: str,
    duration_weeks: int = 4,
    target_hours_per_week: int = 10,
    skill_level: str = "Beginner",
    learning_goal: str = "Full Mastery"
) -> Dict[str, Any]:
    """
    Main entry point for generating study plans.
    Priority: 1) Gemini API  2) Static expert blueprints  3) Dynamic fallback
    """
    # 1. Try Gemini API first
    gemini_plan = call_gemini_for_plan(subject, duration_weeks, target_hours_per_week, skill_level, learning_goal)
    if gemini_plan:
        return gemini_plan

    # Keep plan generation available when an AI provider is not configured or
    # temporarily unavailable. Gemini remains the preferred source above; these
    # vetted blueprints and the dynamic generator provide a useful local fallback.
    blueprint = match_subject_blueprint(subject)
    if blueprint:
        raw_milestones = blueprint["milestones"]
        total_target_hours = duration_weeks * target_hours_per_week
        base_total = sum(m["hours"] for m in raw_milestones) or 20.0
        scale = total_target_hours / base_total

        milestones = []
        for idx, m in enumerate(raw_milestones):
            m_id = f"m-{uuid.uuid4().hex[:8]}"
            scaled_hours = round(m["hours"] * scale, 1)
            res_list = []
            for r in m.get("resources", []):
                res_list.append({
                    "id": f"res-{uuid.uuid4().hex[:6]}",
                    "title": r["title"],
                    "resource_type": r["resource_type"],
                    "url": r["url"],
                    "estimated_minutes": r["estimated_minutes"],
                    "summary": r["summary"],
                    "completed": False
                })
            milestones.append({
                "id": m_id,
                "stage_number": idx + 1,
                "title": f"Week {idx + 1}: {m['title']}" if duration_weeks <= 4 else f"Stage {idx + 1}: {m['title']}",
                "description": m["description"],
                "estimated_hours": scaled_hours,
                "subtopics": m["subtopics"],
                "completed_subtopics": [],
                "resources": res_list,
                "status": "in_progress" if idx == 0 else "pending"
            })

        return {
            "id": f"plan-{uuid.uuid4().hex[:10]}",
            "subject": blueprint["title"],
            "skill_level": skill_level,
            "duration_weeks": duration_weeks,
            "target_hours_per_week": target_hours_per_week,
            "learning_goal": learning_goal,
            "total_estimated_hours": round(total_target_hours, 1),
            "completed_hours": 0.0,
            "milestones": milestones,
            "generated_by": "blueprint",
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        }

    # 3. Fallback dynamic generator
    return generate_ai_curriculum_fallback(
        subject=subject,
        duration_weeks=duration_weeks,
        target_hours_per_week=target_hours_per_week,
        skill_level=skill_level,
        learning_goal=learning_goal
    )

