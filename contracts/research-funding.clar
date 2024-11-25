;; Research Funding Contract

(define-map research-projects uint
  {
    creator: principal,
    title: (string-ascii 256),
    description: (string-ascii 1024),
    funding-goal: uint,
    current-funding: uint,
    expiration-date: uint
  }
)

(define-map project-funders { project-id: uint, funder: principal } uint)

(define-data-var next-project-id uint u0)

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-EXPIRED (err u405))

(define-public (create-project (title (string-ascii 256)) (description (string-ascii 1024)) (funding-goal uint) (duration uint))
  (let
    (
      (project-id (var-get next-project-id))
    )
    (map-set research-projects project-id
      {
        creator: tx-sender,
        title: title,
        description: description,
        funding-goal: funding-goal,
        current-funding: u0,
        expiration-date: (+ block-height duration)
      }
    )
    (var-set next-project-id (+ project-id u1))
    (ok project-id)
  )
)

(define-public (fund-project (project-id uint) (amount uint))
  (let
    (
      (project (unwrap! (map-get? research-projects project-id) ERR-NOT-FOUND))
    )
    (asserts! (< block-height (get expiration-date project)) ERR-EXPIRED)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set research-projects project-id
      (merge project { current-funding: (+ (get current-funding project) amount) })
    )
    (map-set project-funders { project-id: project-id, funder: tx-sender }
      (+ (default-to u0 (map-get? project-funders { project-id: project-id, funder: tx-sender })) amount)
    )
    (ok true)
  )
)

(define-public (withdraw-funds (project-id uint))
  (let
    (
      (project (unwrap! (map-get? research-projects project-id) ERR-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (get creator project)) ERR-UNAUTHORIZED)
    (asserts! (>= (get current-funding project) (get funding-goal project)) ERR-UNAUTHORIZED)
    (try! (as-contract (stx-transfer? (get current-funding project) tx-sender (get creator project))))
    (ok true)
  )
)

(define-read-only (get-project (project-id uint))
  (ok (unwrap! (map-get? research-projects project-id) ERR-NOT-FOUND))
)

(define-read-only (get-funder-contribution (project-id uint) (funder principal))
  (ok (default-to u0 (map-get? project-funders { project-id: project-id, funder: funder })))
)

