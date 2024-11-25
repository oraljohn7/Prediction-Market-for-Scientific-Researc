;; Reputation System Contract

(define-map user-reputation principal
  {
    prediction-count: uint,
    correct-predictions: uint,
    total-stake: uint,
    reputation-score: uint
  }
)

(define-constant ERR-NOT-FOUND (err u404))

(define-public (update-reputation (user principal) (correct bool) (stake uint))
  (let
    (
      (current-rep (default-to
        { prediction-count: u0, correct-predictions: u0, total-stake: u0, reputation-score: u0 }
        (map-get? user-reputation user)
      ))
      (new-prediction-count (+ (get prediction-count current-rep) u1))
      (new-correct-predictions (if correct (+ (get correct-predictions current-rep) u1) (get correct-predictions current-rep)))
      (new-total-stake (+ (get total-stake current-rep) stake))
    )
    (map-set user-reputation user
      (merge current-rep
        {
          prediction-count: new-prediction-count,
          correct-predictions: new-correct-predictions,
          total-stake: new-total-stake,
          reputation-score: (calculate-reputation-score new-prediction-count new-correct-predictions new-total-stake)
        }
      )
    )
    (ok true)
  )
)

(define-private (calculate-reputation-score (prediction-count uint) (correct-predictions uint) (total-stake uint))
  (let
    (
      (accuracy (if (> prediction-count u0) (/ (* correct-predictions u100) prediction-count) u0))
      (stake-factor (/ total-stake u1000000)) ;; Adjust this factor based on your desired stake weight
    )
    (+ (* accuracy u10) (* stake-factor u10))
  )
)

(define-read-only (get-reputation (user principal))
  (ok (unwrap! (map-get? user-reputation user) ERR-NOT-FOUND))
)

